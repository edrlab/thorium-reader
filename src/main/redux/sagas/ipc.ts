// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { ipcMain } from "electron";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { eventChannel } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:saga:ipc";
const debug = debug_(filename_);
debug("_");

function getIpcChannel() {

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

    return channel;
}

function* ipcSyncChannel(ipcData: syncIpc.EventPayload) {

    yield put({
        ...ActionSerializer.deserialize(ipcData.payload.action),
        ...{
            sender: ipcData.sender,
        },
    } as ActionWithSender);
}

export function saga() {

    const ipcChannel = getIpcChannel();

    return takeSpawnEveryChannel(
        ipcChannel,
        ipcSyncChannel,
        (e) => debug("redux IPC sync channel error", e),
    );
}
