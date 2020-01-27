// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { ipcMain } from "electron";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { callTyped } from "readium-desktop/common/redux/typed-saga";
import { diMainGet } from "readium-desktop/main/di";
import { eventChannel } from "redux-saga";
import { all, call, put, take, takeLeading } from "redux-saga/effects";

import { appActions } from "../actions";

function* ipcSyncChannel() {

    const channel = eventChannel<syncIpc.EventPayload>(
        (emit) => {

            const handler = (_0: any, data: syncIpc.EventPayload) => {

                if (syncIpc.EventType.RendererAction) {
                    emit(data);
                }
            };

            ipcMain.on(syncIpc.CHANNEL, handler);

            return () => {
                ipcMain.removeListener(syncIpc.CHANNEL, handler);
            };
        },
    );

    while (42) {

        const ipcData: syncIpc.EventPayload = yield take(channel);

        const actionSerializer = yield* callTyped(() => diMainGet("action-serializer"));

        yield put({
            ...actionSerializer.deserialize(ipcData.payload.action),
            ...{
                sender: ipcData.sender,
            } as ActionWithSender,
        });
    }
}

function* ipcWatcher() {
    yield takeLeading(appActions.initSuccess.ID, ipcSyncChannel);
}

export function* watchers() {
    yield all([
        call(ipcWatcher),
    ]);
}
