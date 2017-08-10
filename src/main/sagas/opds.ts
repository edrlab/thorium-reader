import { ipcMain } from "electron";
import { SagaIterator } from "redux-saga";
import { fork} from "redux-saga/effects";

import {
    OPDS_ADD_REQUEST,
    OPDS_LIST_REQUEST,
    OPDS_LIST_RESPONSE,
    OPDS_REMOVE_REQUEST,
    OPDS_UPDATE_REQUEST,
} from "readium-desktop/events/ipc";
import { OPDS } from "readium-desktop/models/opds";

import { container } from "readium-desktop/main/di";

import { OpdsDb } from "readium-desktop/main/db/opds-db";

import { OpdsMessage } from "readium-desktop/models/ipc";

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
    // Add OPDS
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

function sendOpdsRemoveResponse(renderer: any, opds: OPDS) {
    // Remove OPDS
    const opdsDb: OpdsDb = container.get(
            "opds-db") as OpdsDb;

    opdsDb.remove(opds.identifier)
        .then((result) => {
            sendOpdsListResponse(renderer);
        })
        .catch((err) => {
            console.log(err);
        });
}

function sendOpdsUpdateResponse(renderer: any, opds: OPDS) {
    // Update OPDS
    const opdsDb: OpdsDb = container.get(
            "opds-db") as OpdsDb;

    opdsDb.update(opds)
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

function waitForOpdsRemoveRequest() {
    // Wait for catalog request from a renderer process
    ipcMain.on(OPDS_REMOVE_REQUEST, (event: any, msg: OpdsMessage) => {
        sendOpdsRemoveResponse(event.sender, msg.opds);
    });
}

function waitForOpdsUpdateRequest() {
    // Wait for catalog request from a renderer process
    ipcMain.on(OPDS_UPDATE_REQUEST, (event: any, msg: OpdsMessage) => {
        sendOpdsUpdateResponse(event.sender, msg.opds);
    });
}

export function* watchRendererOpdsListRequest(): SagaIterator {
    yield fork(waitForOpdsListRequest);
    yield fork(waitForOpdsAddRequest);
    yield fork(waitForOpdsRemoveRequest);
    yield fork(waitForOpdsUpdateRequest);
}
