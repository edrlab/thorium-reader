import { ipcMain } from "electron";
import { Store } from "redux";
import { channel, Channel, SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { BrowserWindow } from "electron";


import * as catalogActions from "readium-desktop/actions/catalog";
import { CATALOG_INIT, CATALOG_SET } from "readium-desktop/actions/catalog";
import {
    SYNC_CATALOG_REQUEST,
    SYNC_CATALOG_RESPONSE
} from "readium-desktop/events/ipc";
import { Catalog } from "readium-desktop/models/catalog";
import { OPDSParser } from "readium-desktop/services/opds";

import {
    PUBLICATION_DOWNLOAD_FINISH,
    PUBLICATION_DOWNLOAD_PROGRESS,
} from "readium-desktop/main/actions/publication";
import { AppState } from "readium-desktop/main/reducers";

import { container } from "readium-desktop/main/di";

const CATALOG_OPDS_URL = "http://fr.feedbooks.com/books/top.atom?category=FBFIC019000&lang=fr";

function loadCatalog(chan: Channel<Catalog>) {
    const opdsParser: OPDSParser = container.get("opds-parser") as OPDSParser;
    console.log("#####", "Load from OPDS");
    opdsParser
        .parse(CATALOG_OPDS_URL)
        .then((catalog: Catalog) => {
            console.log("#####", "Loaded from OPDS");
            chan.put(catalog);
        })
        .catch((error: any) => {
            console.log("## Error:", error);
        });
}

export function* watchCatalogInit(): SagaIterator {
    yield take(CATALOG_INIT);
    const chan = yield call(channel);
    yield fork(loadCatalog, chan);
    const catalog = yield take(chan);
    yield put(catalogActions.set(catalog));
}

function sendCatalogResponse(renderer: any) {
    // Get catalog
    const store: Store<AppState> = container.get("store") as Store<AppState>;
    renderer.send(
        SYNC_CATALOG_RESPONSE,
        {catalog: store.getState().catalog},
    );
}

function waitForSyncRequest(chan: Channel<any>) {
    // Wait for catalog request from a renderer process
    ipcMain.on(SYNC_CATALOG_REQUEST, (event: any) => {
        sendCatalogResponse(event.sender);
        chan.put({status: "success"});
    });
}

export function* watchRendererCatalogRequest(): SagaIterator {
    while (true) {
        const chan = yield call(channel);
        yield fork(waitForSyncRequest, chan);
        yield take(chan);
    }
}

// Synchronize catalog from main process to renderer processes
export function* watchCatalogUpdate(): SagaIterator {
    while (true) {
        const action = yield take([
            PUBLICATION_DOWNLOAD_PROGRESS,
            PUBLICATION_DOWNLOAD_FINISH,
            CATALOG_SET,
        ]);

        console.log("#####", "Update renderer catalog");

        let windows = BrowserWindow.getAllWindows();
        for (let window of windows) {
            sendCatalogResponse(window.webContents);
        }
    }
}
