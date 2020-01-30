// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { ipcRenderer } from "electron";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { actionSerializer } from "readium-desktop/renderer/common/actionSerializer";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { eventChannel } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

function* ipcSyncChannel() {

    const channel = eventChannel<syncIpc.EventPayload>(
        (emit) => {

            const handler = (_0: any, data: syncIpc.EventPayload) => {

                if (data.type === syncIpc.EventType.MainAction) {
                    emit(data);
                }
            };

            ipcRenderer.on(syncIpc.CHANNEL, handler);

            return () => {
                ipcRenderer.removeListener(syncIpc.CHANNEL, handler);
            };
        },
    );

    while (42) {

        const ipcData: syncIpc.EventPayload = yield take(channel);

        yield put({
            ...actionSerializer.deserialize(ipcData.payload.action),
            ...{
                sender: ipcData.sender,
            },
        } as ActionWithSender);
    }
}

export function* watchers() {

    yield take(winActions.initSuccess.ID);

    yield all([
        call(ipcSyncChannel),
    ]);
}
