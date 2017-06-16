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
        console.log("## Start server");
        const streamerUrl = streamer.start(port);

        chan.put({
            streamerUrl,
        });
    });
}

function sendManifestOpenRequest(
    renderer: any,
    publication: Publication,
    manifestUrl: string
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
        const state: AppState =  yield select();
        const downloads = state.publicationDownloads
            .publicationIdentifierToDownloads[publication.identifier];
        const epubPath = downloads[0].dstPath;

        // Start streamer
        const streamer: Server = container.get("streamer") as Server;
        yield fork(startStreamer, streamer, chanStreamerStart);
        const streamerStartResponse: any = yield take(chanStreamerStart);
        yield put(streamerActions.start(streamerStartResponse.streamerUrl));

        // Load epub in streamer
        const manifestPaths = streamer.addPublications([epubPath]);
        const manifestUrl = streamer.url() + manifestPaths[0];
        yield fork(sendManifestOpenRequest, renderer, publication, manifestUrl);
    }
}

function waitForStreamerManifestCloseRequest(
    chan: Channel<any>,
) {
    ipcMain.on(
        STREAMER_MANIFEST_CLOSE_REQUEST,
        (event: any, msg: any) => {
            chan.put({});
        },
    );
}

export function* watchStreamManifestCloseRequest(): SagaIterator {
    const chan = yield call(channel);

    yield fork(waitForStreamerManifestCloseRequest, chan);

    while (true) {
        yield take(chan);

        // Load epub in streamer
        const streamer: Server = container.get("streamer") as Server;
        console.log("## Stop server");
        streamer.stop();
        yield put(streamerActions.stop());
    }
}
