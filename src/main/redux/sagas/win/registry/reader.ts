// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { i18nActions, readerActions } from "readium-desktop/common/redux/actions";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { all, call, takeEvery } from "redux-saga/effects";
import { put } from "typed-redux-saga";

function* winOpen(action: winActions.registry.registerReader.TAction) {

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

    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: readerActions.openSuccess.build(state.reader.readers[appId]),
        },
    } as syncIpc.EventPayload);

    // Send reader config
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: readerActions.configSetSuccess.build(state.reader.config),
        },
    } as syncIpc.EventPayload);

    // Send reader mode
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: readerActions.detachModeSuccess.build(state.reader.mode),
        },
    } as syncIpc.EventPayload);

    // Send locale
    webContents.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.MainAction,
        payload: {
            action: i18nActions.setLocale.build(state.i18n.locale),
        },
    } as syncIpc.EventPayload);

}

function* winClose(action: winActions.registry.unregisterReader.TAction) {

    const readers = yield* selectTyped((state: RootState) => state.win.registry.reader);

    const reader = readers.find((_reader) => _reader.identifier === action.payload.identifier);

    if (reader) {
        yield put(streamerActions.publicationCloseRequest.build(reader.publicationIdentifier));
    }

    // TODO : how does it works
    if (readers.length === 0) {
        yield put(readerActions.detachModeSuccess.build(ReaderMode.Attached));
    }

    const libraryWindow = getLibraryWindowFromDi();

    if (libraryWindow) {
        if (libraryWindow.isMinimized()) {
            libraryWindow.restore();
        } else if (!libraryWindow.isVisible()) {
            libraryWindow.close();
            return;
        }
        libraryWindow.show(); // focuses as well
    }
}

function* winRegisterReaderWatcher() {
    yield takeEvery(winActions.registry.registerReader.ID, winOpen);
    yield takeEvery(winActions.registry.unregisterReader.ID, winClose);
}

export function* watchers() {
    yield all([
        call(winRegisterReaderWatcher),
    ]);
}
