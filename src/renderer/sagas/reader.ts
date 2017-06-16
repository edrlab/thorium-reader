import { ipcRenderer } from "electron";

import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import {
    STREAMER_MANIFEST_CLOSE_REQUEST,
    STREAMER_MANIFEST_OPEN_REQUEST,
    STREAMER_MANIFEST_OPEN_RESPONSE,
} from "readium-desktop/events/ipc";
import { Publication } from "readium-desktop/models/publication";

import {
    READER_CLOSE,
    READER_INIT,
} from "readium-desktop/renderer/actions/reader";
import *  as readerActions from "readium-desktop/renderer/actions/reader";

function sendStreamerManifestOpenRequest(publication: Publication) {
    ipcRenderer.send(STREAMER_MANIFEST_OPEN_REQUEST, {
        publication,
    });
}

export function* watchReaderInit(): SagaIterator {
    while (true) {
        let resp = yield take(READER_INIT);
        yield call(sendStreamerManifestOpenRequest, resp.publication);
    }
}

function sendStreamerManifestCloseRequest(
    publication: Publication,
    manifestUrl: string,
) {
    ipcRenderer.send(STREAMER_MANIFEST_CLOSE_REQUEST, {
        publication,
        manifestUrl,
    });
}

export function* watchReaderClose(): SagaIterator {
    while (true) {
        let action = yield take(READER_CLOSE);
        yield call(
            sendStreamerManifestCloseRequest,
            action.publication,
            action.manifestUrl,
        );
    }
}

function waitForEpubManifestUrlResponse(chan: Channel<any>) {
    // Wait for epub manifest url response from main process
    ipcRenderer.on(STREAMER_MANIFEST_OPEN_RESPONSE, (event: any, msg: any) => {
        chan.put({
            publication: msg.publication,
            manifestUrl: msg.manifestUrl,
        });
    });
}

/**
 * If catalog from main process has been updated
 * Update renderer catalog
 */
export function* watchEpubManifestUrlResponse(): SagaIterator {
    const chan = yield call(channel);
    yield fork(waitForEpubManifestUrlResponse, chan);

    while (true) {
        // Wait for a manifest url
        const response = yield take(chan);

        // Open reader
        yield put(readerActions.open(
            response.publication,
            response.manifestUrl,
        ));
    }
}
