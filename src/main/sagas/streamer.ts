import * as path from "path";

import { ipcMain } from "electron";
import * as portfinder from "portfinder";

import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, select, take } from "redux-saga/effects";

import { Server } from "r2-streamer-js";

import {
    STREAMER_MANIFEST_CLOSE_REQUEST,
    STREAMER_MANIFEST_OPEN_REQUEST,
    STREAMER_MANIFEST_OPEN_RESPONSE,
} from "readium-desktop/events/ipc";
import { PublicationMessage } from "readium-desktop/models/ipc";
import { Publication } from "readium-desktop/models/publication";

import { container } from "readium-desktop/main/di";
import { AppState } from "readium-desktop/main/reducers";

import * as streamerActions from "readium-desktop/main/actions/streamer";
import { STREAMER_PUBLICATION_CLOSE } from "readium-desktop/main/actions/streamer";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

function waitForStreamerManifestOpenRequest(chan: Channel<any>) {
    ipcMain.on(
        STREAMER_MANIFEST_OPEN_REQUEST,
        (event: any, msg: PublicationMessage) => {
            chan.put({
                renderer: event.sender,
                publication: msg.publication,
            });
        },
    );
}

function startStreamer(streamer: Server, chan: Channel<any>) {
    // Find a free port on your local machine
    portfinder.getPort((err, port) => {
        const streamerUrl = streamer.start(port);
        console.log("# Start r2 streamer", streamerUrl);
        chan.put({
            streamerUrl,
        });
    });
}

function sendManifestOpenRequest(
    renderer: any,
    publication: Publication,
    manifestUrl: string,
) {
    renderer.send(
        STREAMER_MANIFEST_OPEN_RESPONSE,
        { publication, manifestUrl },
    );
}

export function* watchStreamManifestOpenRequest(): SagaIterator {
    const chanIpcWait = yield call(channel);
    const chanStreamerStart = yield call(channel);

    yield fork(waitForStreamerManifestOpenRequest, chanIpcWait);

    while (true) {
        const ipcWaitResponse: any = yield take(chanIpcWait);
        const publication = ipcWaitResponse.publication;
        const renderer = ipcWaitResponse.renderer;

        // Get epub file from publication
        const pubStorage: PublicationStorage = container.get("publication-storage") as PublicationStorage;
        const epubPath = path.join(
            pubStorage.getRootPath(),
            publication.files[0].url.substr(6),
        );

        // Start streamer if it's not already started
        const state: AppState =  yield select();
        const streamer: Server = container.get("streamer") as Server;

        if (state.streamer.baseUrl === undefined) {
            yield fork(startStreamer, streamer, chanStreamerStart);
            const streamerStartResponse: any = yield take(chanStreamerStart);
            yield put(streamerActions.start(streamerStartResponse.streamerUrl));
        }

        // Load epub in streamer
        const manifestPaths = streamer.addPublications([epubPath]);
        const manifestUrl = streamer.url() + manifestPaths[0];
        yield fork(sendManifestOpenRequest, renderer, publication, manifestUrl);
        yield put(streamerActions.openPublication(publication));
    }
}

function waitForStreamerManifestCloseRequest(
    chan: Channel<any>,
) {
    ipcMain.on(
        STREAMER_MANIFEST_CLOSE_REQUEST,
        (event: any, msg: any) => {
            chan.put(msg);
        },
    );
}

export function* watchStreamManifestCloseRequest(): SagaIterator {
    const chan = yield call(channel);

    yield fork(waitForStreamerManifestCloseRequest, chan);

    while (true) {
        const response = yield take(chan);
        const publication = response.publication;

        // Remove publication from streamer
        yield put(streamerActions.closePublication(publication));
    }
}

export function* watchPublicationCloseRequest(): SagaIterator {
    while (true) {
        const action = yield take(STREAMER_PUBLICATION_CLOSE);
        const publication = action.publication;

        const state: AppState =  yield select();
        const streamer: Server = container.get("streamer") as Server;
        const pubStorage: PublicationStorage = container.get("publication-storage") as PublicationStorage;

        if (state.streamer.openPublicationCounter[publication.identifier] === undefined) {
            // Remove publication from streamer because there is no more readers
            // open for this publication
            // Get epub file from publication
            const epubPath = path.join(
                pubStorage.getRootPath(),
                publication.files[0].url.substr(6),
            );
            streamer.removePublications([epubPath]);
        }
        if (Object.keys(state.streamer.openPublicationCounter).length === 0) {
            // Stop server
            console.log("# Stop r2 streamer");
            streamer.stop();
            yield put(streamerActions.stop());
        }
    }
}
