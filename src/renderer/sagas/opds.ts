import { ipcRenderer } from "electron";
import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import * as opdsActions from "readium-desktop/actions/opds";
import {
    OPDS_ADD_REQUEST,
    OPDS_LIST_REQUEST,
    OPDS_LIST_RESPONSE,
} from "readium-desktop/events/ipc";
import { OpdsMessage } from "readium-desktop/models/ipc";
import { OPDS } from "readium-desktop/models/opds";

import { WINDOW_INIT } from "readium-desktop/renderer/actions/window";

/**
 * Retrieve catalog from main process
 */
function retrieveOpdsList() {
    ipcRenderer.send(OPDS_LIST_REQUEST);
}

function AddOpds(msg: OpdsMessage) {
    ipcRenderer.send(OPDS_ADD_REQUEST, msg);
}

export function* watchOpdsListInit(): SagaIterator {
    yield take(WINDOW_INIT);
    yield call(retrieveOpdsList);
}

export function* watchOpdsAdd(): SagaIterator {
    while (true) {
        let resp = yield take(opdsActions.OPDS_ADD);
        let msg: OpdsMessage = {opds: resp.opds};
        AddOpds(msg);
    }
}

function waitForOpdsListResponse(chan: Channel<OPDS[]>) {
    // Wait for catalog response from main process
    ipcRenderer.on(OPDS_LIST_RESPONSE, (event: any, msg: OpdsMessage) => {
        console.log(msg);
        chan.put(msg.opdsList);
    });
}

/**
 * If catalog from main process has been updated
 * Update renderer catalog
 */
export function* watchMainOpdsResponse(): SagaIterator {
    const chan = yield call(channel);
    yield fork(waitForOpdsListResponse, chan);

    while (true) {
        // Wait for a response from the main process
        const opds = yield take(chan);
        yield put(opdsActions.set(opds));
    }
}
