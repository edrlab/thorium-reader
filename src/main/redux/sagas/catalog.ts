import { BrowserWindow, ipcMain } from "electron";
import { Store } from "redux";
import { Buffer, buffers, channel, Channel, delay, SagaIterator } from "redux-saga";
import { actionChannel, call, fork, put, take } from "redux-saga/effects";
import * as request from "request";

import * as catalogActions from "readium-desktop/actions/catalog";
import {
    CATALOG_INIT,
    CATALOG_LOAD,
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

import { RootState } from "readium-desktop/main/redux/states";

import { container } from "readium-desktop/main/di";

import { PublicationDb } from "readium-desktop/main/db/publication-db";

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

// tslint:disable-next-line:no-unused-variable
function loadCatalogFromOPDS(chan: Channel<CatalogResponse>) {
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

function loadCatalogFromDb(chan: Channel<CatalogResponse>) {
    // Load catalog from database
    const db: PublicationDb = container.get(
        "publication-db") as PublicationDb;
    db
        .getAll()
        .then((result) => {
            chan.put({
                type: CatalogResponseType.Catalog,
                catalog: {
                    title: "Catalog",
                    publications: result,
                },
            });
        })
        .catch((err) => {
            console.log(err);
        });
}

export function* watchCatalogInit(): SagaIterator {
    const chan = yield call(channel);

    while (true) {
        yield take([CATALOG_INIT, CATALOG_LOAD]);
        yield fork(loadCatalogFromDb, chan);
        const catalogResponse: CatalogResponse = yield take(chan);

        if (catalogResponse.type === CatalogResponseType.Catalog) {
            yield put(catalogActions.set(catalogResponse.catalog));
        } else {
            console.error("Unable to load catalog");
        }
    }
}

function sendCatalogResponse(renderer: any) {
    // Get catalog
    const store = container.get("store") as Store<RootState>;
    renderer.send(
        SYNC_CATALOG_RESPONSE,
        {catalog: store.getState().catalog},
    );
}

function waitForSyncRequest() {
    // Wait for catalog request from a renderer process
    ipcMain.on(SYNC_CATALOG_REQUEST, (event: any) => {
        sendCatalogResponse(event.sender);
    });
}

export function* watchRendererCatalogRequest(): SagaIterator {
    yield fork(waitForSyncRequest);
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

        // Limit the catalog refresh to 1s
        yield call(delay, 1000);
    }
}
