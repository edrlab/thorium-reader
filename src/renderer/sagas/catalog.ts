import { ipcRenderer } from "electron";
import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import * as catalogActions from "readium-desktop/actions/catalog";
import {
    SYNC_CATALOG_REQUEST,
    SYNC_CATALOG_RESPONSE,
} from "readium-desktop/events/ipc";
import { Catalog } from "readium-desktop/models/catalog";
import { CatalogMessage } from "readium-desktop/models/ipc";

import { WINDOW_INIT } from "readium-desktop/renderer/actions/window";

/**
 * Retrieve catalog from main process
 */
function retrieveCatalog() {
    ipcRenderer.send(SYNC_CATALOG_REQUEST);
}

export function* watchCatalogInit(): SagaIterator {
    yield take(WINDOW_INIT);
    yield call(retrieveCatalog);
}

function waitForSyncResponse(chan: Channel<Catalog>) {
    // Wait for catalog response from main process
    ipcRenderer.on(SYNC_CATALOG_RESPONSE, (event: any, msg: CatalogMessage) => {
        chan.put(msg.catalog);
    });
}

/**
 * If catalog from main process has been updated
 * Update renderer catalog
 */
export function* watchMainCatalogResponse(): SagaIterator {
    const chan = yield call(channel);
    yield fork(waitForSyncResponse, chan);

    while (true) {
        // Wait for a response from the main process
        const catalog = yield take(chan);
        yield put(catalogActions.set(catalog));
    }
}
