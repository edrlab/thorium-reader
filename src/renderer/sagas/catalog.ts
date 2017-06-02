import { ipcRenderer } from "electron";

import { channel, Channel } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import * as catalogActions from "readium-desktop/actions/catalog";
import {
    CATALOG_GET_REQUEST,
    CATALOG_GET_RESPONSE,
} from "readium-desktop/events/ipc";
import { Catalog } from "readium-desktop/models/catalog";
import { CatalogMessage } from "readium-desktop/models/ipc";

function sendRequest() {
    // Request catalog from main process
    ipcRenderer.send(CATALOG_GET_REQUEST);
}

function waitForResponse(chan: Channel<Catalog>) {
    // Wait for catalog response from main process
    ipcRenderer.on(CATALOG_GET_RESPONSE, (event: any, msg: CatalogMessage) => {
        chan.put(msg.catalog);
    });
}

export function* loadCatalog() {
    // Send request to the main process
    yield call(sendRequest);

    // Wait for a response from the main process
    const chan = yield call(channel);
    yield fork(waitForResponse, chan);
    const catalog = yield take(chan);
    yield put(catalogActions.set(catalog));
}
