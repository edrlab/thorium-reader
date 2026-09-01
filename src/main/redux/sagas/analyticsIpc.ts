// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { ipcMain } from "electron";
import { analyticsIpc } from "readium-desktop/common/ipc";
import { settingsGoogleAnalyticsTelemetryIsEnabled } from "readium-desktop/common/redux/states/settings";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { logMeasurementProtocol } from "readium-desktop/main/analytics/measurementProtocol";
import { error } from "readium-desktop/main/tools/error";
import { buffers, eventChannel } from "redux-saga";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { RootState } from "../states";

const filename_ = "readium-desktop:main:saga:analytics-ipc";
const debug = debug_(filename_);

function getAnalyticsIpcChannel() {

    const channel = eventChannel<analyticsIpc.EventPayload>(
        (emit) => {

            const handler = (_0: Electron.IpcMainEvent, data: analyticsIpc.EventPayload) => {

                if (data?.type === analyticsIpc.EventType.LogEvent) {
                    emit(data);
                }
            };

            ipcMain.on(analyticsIpc.CHANNEL, handler);

            return () => {
                ipcMain.removeListener(analyticsIpc.CHANNEL, handler);
            };
        },
        buffers.fixed(20),
    );

    return channel;
}

function* analyticsIpcChannel(ipcData: analyticsIpc.EventPayload) {

    const clientId = yield* selectTyped((state: RootState) => state.analytics.clientId);
    const locale = yield* selectTyped((state: RootState) => state.i18n.locale);
    const googleAnalyticsTelemetryEnabled = yield* selectTyped((state: RootState) =>
        settingsGoogleAnalyticsTelemetryIsEnabled(state.settings));

    yield* callTyped(logMeasurementProtocol, ipcData.payload.name, ipcData.payload.params, {
        clientId,
        locale,
        disabled: !googleAnalyticsTelemetryEnabled,
    });
}

export function saga() {

    const ipcChannel = getAnalyticsIpcChannel();

    return takeSpawnEveryChannel(
        ipcChannel,
        analyticsIpcChannel,
        (e) => {
            debug("analytics IPC channel error", e);
            error(filename_, e);
        },
    );
}
