import { ipcMain, remote } from "electron";
import { Store } from "redux";
import { Buffer, buffers, SagaIterator } from "redux-saga";
import { actionChannel, fork, take } from "redux-saga/effects";

import {
    OPDS_ADD_REQUEST,
    OPDS_LIST_REQUEST,
    OPDS_LIST_RESPONSE,
} from "readium-desktop/events/ipc";
import { OPDS } from "readium-desktop/models/opds";

import { container } from "readium-desktop/main/di";

import { OpdsDb } from "readium-desktop/main/db/opds-db";
import { AppState } from "readium-desktop/main/reducers/index";

import * as opdsActions from "readium-desktop/actions/opds";
import {
    OPDS_ADD,
    OPDS_LOAD,
    OpdsAction,
} from "readium-desktop/actions/opds";

import { OpdsMessage } from "readium-desktop/models/ipc";

export function* watchOpdsUpdate(): SagaIterator {
    let buffer: Buffer<any> = buffers.expanding(20);
    let chan = yield actionChannel([
            OPDS_ADD,
        ], buffer);

    while (true) {
        const action: OpdsAction = yield take(chan);
        const opdsDb: OpdsDb = container.get(
            "opds-db") as OpdsDb;
        const store: Store<AppState> = container.get("store") as Store<AppState>;
        switch (action.type) {
            case OPDS_ADD:
                console.log ("Attention !!! On va ajouter !");
                opdsDb
                    .put(action.opds)
                    .then((result) => {
                        store.dispatch(opdsActions.load());
                    });
                break;
            default:
                break;
        }
    }
}

export function* watchOpdsLoad(): SagaIterator {
    while (true) {
        yield take([OPDS_LOAD]);
        let renderer = remote.getCurrentWebContents();
        yield fork(sendOpdsListResponse, renderer);
    }
}

function sendOpdsListResponse(renderer: any) {
    // Get OPDS List
    const opdsDb: OpdsDb = container.get(
            "opds-db") as OpdsDb;

    opdsDb.getAll()
        .then((result) => {
            renderer.send(
                OPDS_LIST_RESPONSE,
                { opdsList: result },
            );
        })
        .catch((err) => {
            console.log(err);
        });
}

function sendOpdsAddResponse(renderer: any, opds: OPDS) {
    // Get OPDS List
    const opdsDb: OpdsDb = container.get(
            "opds-db") as OpdsDb;

    opdsDb.put(opds)
        .then((result) => {
            sendOpdsListResponse(renderer);
        })
        .catch((err) => {
            console.log(err);
        });
}

function waitForOpdsListRequest() {
    // Wait for catalog request from a renderer process
    ipcMain.on(OPDS_LIST_REQUEST, (event: any) => {
        sendOpdsListResponse(event.sender);
    });
}

function waitForOpdsAddRequest() {
    // Wait for catalog request from a renderer process
    ipcMain.on(OPDS_ADD_REQUEST, (event: any, msg: OpdsMessage) => {
        sendOpdsAddResponse(event.sender, msg.opds);
    });
}

export function* watchRendererOpdsListRequest(): SagaIterator {
    yield fork(waitForOpdsListRequest);
    yield fork(waitForOpdsAddRequest);
}
