// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { savedLibraryWindowInDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { all, call, takeEvery } from "redux-saga/effects";

function* winOpen(action: winActions.registry.registerLibrary.TAction) {

    const libWindow = action.payload.win;
    const webContents = libWindow.webContents;
    const state = yield* selectTyped((_state: RootState) => _state);
    const appId = action.payload.identifier;

    // Send the id to the new window
    webContents.send(winIpc.CHANNEL, {
        type: winIpc.EventType.IdResponse,
        payload: {
            winId: appId,
        },
    } as winIpc.EventPayload);

    // Send locale
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: i18nActions.setLocale.build(state.i18n.locale),
        },
    } as syncIpc.EventPayload);

    // // Init network on window
    // let actionNet = null;

    // switch (state.net.status) {
    //     case NetStatus.Online:
    //         actionNet = netActions.online.build();
    //         break;
    //     case NetStatus.Offline:
    //     default:
    //         actionNet = netActions.offline.build();
    //         break;
    // }

    // // Send network status
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: actionNet,
    //     },
    // } as syncIpc.EventPayload);

    // // Send update info
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: {
    //             type: updateActions.latestVersion.ID,
    //             payload: updateActions.latestVersion.build(
    //                 state.update.status,
    //                 state.update.latestVersion,
    //                 state.update.latestVersionUrl),
    //         },
    //     },
    // } as syncIpc.EventPayload);

    savedLibraryWindowInDi(libWindow);
}

function* winClose(_action: winActions.registry.unregisterLibrary.TAction) {

    const readers = yield* selectTyped((state: RootState) => state.win.registry.reader);

    readers.forEach(
        (reader) =>
            getReaderWindowFromDi(reader.identifier).close());
}

function* winRegisterLibraryWatcher() {
    yield takeEvery(winActions.registry.registerLibrary.ID, winOpen);
    yield takeEvery(winActions.registry.unregisterLibrary.ID, winClose);
}

export function* watchers() {
    yield all([
        call(winRegisterLibraryWatcher),
    ]);
}
