import * as path from "path";

import { ipcMain } from "electron";
import * as portfinder from "portfinder";

import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, select, take } from "redux-saga/effects";

import { Server } from "@r2-streamer-js/http/server";

import { Publication } from "readium-desktop/models/publication";

import { container } from "readium-desktop/main/di";
import { AppState } from "readium-desktop/main/reducers";

import * as streamerActions from "readium-desktop/main/actions/streamer";
import { StreamerAction }  from "readium-desktop/main/actions/streamer";
import {
    STREAMER_PUBLICATION_CLOSE,
    STREAMER_PUBLICATION_OPEN } from "readium-desktop/main/actions/streamer";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

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

export function* watchStreamerPublicationOpen(): SagaIterator {
    const chanStreamerStart = yield call(channel);

    while (true) {
        const action: StreamerAction = yield take(STREAMER_PUBLICATION_OPEN);
        const publication = action.publication;

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
        yield put(streamerActions.openPublicationManifest(
            publication, manifestUrl,
        ));
    }
}

export function* watchStreamerPublicationClose(): SagaIterator {
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
