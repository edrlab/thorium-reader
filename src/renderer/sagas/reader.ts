import { ipcRenderer } from "electron";

import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import {
    READER_OPEN_REQUEST,
} from "readium-desktop/events/ipc";
import { Publication } from "readium-desktop/models/publication";
import {
    READER_INIT,
} from "readium-desktop/renderer/actions/reader";

function sendStreamerManifestOpenRequest(publication: Publication) {
    // ipcRenderer.send(STREAMER_MANIFEST_OPEN_REQUEST, {
    //     publication,
    // });
    ipcRenderer.send(READER_OPEN_REQUEST, {
        publication,
    });
}
export function* watchReaderInit(): SagaIterator {
    while (true) {
        let resp = yield take(READER_INIT);
        yield call(sendStreamerManifestOpenRequest, resp.publication);
    }
}
