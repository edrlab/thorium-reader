// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { readerIpc } from "readium-desktop/common/ipc";
import { readerActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped } from "readium-desktop/common/redux/typed-saga";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH,
} from "readium-desktop/preprocessor-directives";
import { all, call, put, takeEvery } from "redux-saga/effects";

import { createReaderWindow } from "./browserWindow/createReaderWindow";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");
debug("_");

function* winOpen(action: winActions.reader.openSucess.TAction) {

    const identifier = action.payload.identifier;
    debug(`reader ${identifier} -> winOpen`);

    const readerWin = action.payload.win;
    const webContents = readerWin.webContents;
    const locale = yield* selectTyped((_state: RootState) => _state.i18n.locale);
    const reader = yield* selectTyped((_state: RootState) => _state.win.session.reader[identifier]);

    webContents.send(readerIpc.CHANNEL, {
        type: readerIpc.EventType.request,
        payload: {
            i18n: {
                locale,
            },
            win: {
                identifier,
            },
            reader: reader?.reduxState,
        },
    } as readerIpc.EventPayload);

    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: readerActions.openSuccess.build(state.reader.readers[winId]),
    //     },
    // } as syncIpc.EventPayload);

    // // Send reader config
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: readerActions.configSetSuccess.build(state.reader.config),
    //     },
    // } as syncIpc.EventPayload);

    // Send reader mode
    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: readerActions.detachModeSuccess.build(state.reader.mode),
    //     },
    // } as syncIpc.EventPayload);
    // send with an API Request now
    // should be removed

    // webContents.send(syncIpc.CHANNEL, {
    //     type: syncIpc.EventType.MainAction,
    //     payload: {
    //         action: i18nActions.setLocale.build(state.i18n.locale),
    //     },
    // } as syncIpc.EventPayload);

}

function* winClose(action: winActions.reader.closed.TAction) {

    const identifier = action.payload.identifier;
    debug(`reader ${identifier} -> winClose`);

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
    const reader = readers[identifier];

    if (reader) {
        yield put(streamerActions.publicationCloseRequest.build(reader.publicationIdentifier));

        yield put(winActions.session.unregisterReader.build(identifier));

        yield put(winActions.registry.registerReaderPublication.build(
            reader.publicationIdentifier,
            reader.windowBound,
            reader.reduxState),
        );
    }

    if (Object.keys(readers).length < 1) {
        yield put(readerActions.attachModeRequest.build());
    }

    const libraryWindow = yield* callTyped(() => getLibraryWindowFromDi());
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

function* openReaderWatcher() {
    yield all([
        takeEvery(winActions.reader.openRequest.ID, createReaderWindow),
        takeEvery(winActions.reader.openSucess.ID, winOpen),
    ]);
}

function* closedReaderWatcher() {
    yield all([
        takeEvery(winActions.reader.closed.ID, winClose),
    ]);
}

export function* watchers() {
    yield all([
        call(openReaderWatcher),
        call(closedReaderWatcher),
    ]);
}
