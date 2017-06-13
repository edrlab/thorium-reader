import { BrowserWindow, ipcMain } from "electron";
import { Store } from "redux";
import { Buffer, buffers, channel, Channel, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, take } from "redux-saga/effects";
import * as request from "request";

import * as catalogActions from "readium-desktop/actions/catalog";
import {
    CATALOG_INIT,
    CATALOG_SET,
    PUBLICATION_UPDATE,
} from "readium-desktop/actions/catalog";
import {
    SYNC_CATALOG_REQUEST,
    SYNC_CATALOG_RESPONSE,
} from "readium-desktop/events/ipc";
import { Catalog } from "readium-desktop/models/catalog";
import { Error } from "readium-desktop/models/error";
import { OPDSParser } from "readium-desktop/services/opds";

import {
    PUBLICATION_DOWNLOAD_FINISH,
    PUBLICATION_DOWNLOAD_PROGRESS,
} from "readium-desktop/actions/publication-download";
import { AppState } from "readium-desktop/main/reducers";

import { container } from "readium-desktop/main/di";

const CATALOG_OPDS_URL = "http://www.feedbooks.com/books/top.atom?category=FBFIC019000";

enum CatalogResponseType {
    Error, // Response implements Error interface
    Catalog, // Response implements Catalog interface
}

interface CatalogResponse {
    type: CatalogResponseType;
    catalog?: Catalog;
    error?: Error;
}

function loadCatalog(chan: Channel<CatalogResponse>) {
    request(CATALOG_OPDS_URL, (error, response, body) => {
        if (response && (
                response.statusCode < 200 || response.statusCode > 299)) {
            // Unable to download the resource
            return chan.put({
                type: CatalogResponseType.Error,
                error: {
                    code: response.statusCode,
                    msg: "Http error",
                },
            });
        }

        if (error) {
            return chan.put({
                type: CatalogResponseType.Error,
                error: {
                    code: 1,
                    msg: "Error",
                },
            });
        }

        // A correct response has been received
        // So parse the feed and generate a catalog
        console.log("### OPDS loaded");
        const opdsParser: OPDSParser = container.get("opds-parser") as OPDSParser;
        opdsParser
            .parse(body)
            .then((catalog: Catalog) => {
                chan.put({
                    type: CatalogResponseType.Catalog,
                    catalog,
                });
            });
    });
}

export function* watchCatalogInit(): SagaIterator {
    yield take(CATALOG_INIT);
    console.log("### Catalog init");
    const chan = yield call(channel);
    yield fork(loadCatalog, chan);
    const catalogResponse: CatalogResponse = yield take(chan);

    if (catalogResponse.type === CatalogResponseType.Catalog) {
        yield put(catalogActions.set(catalogResponse.catalog));
    } else {
        console.error("Unable to load catalog");
    }
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
    let buffer: Buffer<any> = buffers.expanding(20);
    let chan = yield actionChannel([
            PUBLICATION_UPDATE,
            CATALOG_SET,
        ], buffer);
    while (true) {
        yield take(chan);

        let windows = BrowserWindow.getAllWindows();
        for (let window of windows) {
            sendCatalogResponse(window.webContents);
        }
    }
}
