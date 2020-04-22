// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { ipcMain } from "electron";
import { error } from "readium-desktop/common/error";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { diMainGet } from "readium-desktop/main/di";
import { eventChannel } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:saga:ipc";
const debug = debug_(filename_);
debug("_");

function* ipcSyncChannel() {

    const channel = eventChannel<syncIpc.EventPayload>(
        (emit) => {

            const handler = (_0: any, data: syncIpc.EventPayload) => {

                if (data.type === syncIpc.EventType.RendererAction) {
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
            },
        } as ActionWithSender);
    }
}

export function* watchers() {
    try {

        yield all([
            call(ipcSyncChannel),
        ]);

    } catch (err) {
        error(filename_, err);
    }
}
