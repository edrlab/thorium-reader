// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow, Menu } from "electron";
import * as path from "path";
import { LocatorType } from "readium-desktop/common/models/locator";
import { Reader, ReaderConfig, ReaderMode } from "readium-desktop/common/models/reader";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { AppWindowType } from "readium-desktop/common/models/win";
import { getWindowBounds } from "readium-desktop/common/rectangle/window";
import { readerActions, i18nActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { appActions, streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { SagaIterator } from "redux-saga";
import { all, call, put, take, takeEvery } from "redux-saga/effects";

import { convertHttpUrlToCustomScheme } from "@r2-navigator-js/electron/common/sessions";
import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { createReaderWindow } from "./browserWindow/createReaderWindow";
import { syncIpc, winIpc } from "readium-desktop/common/ipc";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");

function* winOpen(action: winActions.reader.openSucess.TAction) {

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

    yield put(readerActions.openSuccess.build());
}

function* winClose(action: winActions.reader.closed.TAction) {

    const reader = yield* selectTyped(
        (state: RootState) =>
            state.win.session.reader[action.payload.identifier],
    );

    if (reader) {
        yield put(streamerActions.publicationCloseRequest.build(reader.publicationIdentifier));
    }

    const readers = yield* selectTyped(
        (state: RootState) =>
            state.win.session.reader,
    );
    if (!Object.keys(readers).length) {
        yield put(readerActions.detachModeSuccess.build(ReaderMode.Attached));
    }

    const libraryWindow: Electron.BrowserWindow = yield callTyped(() => getLibraryWindowFromDi());

    if (libraryWindow) {
        if (libraryWindow.isMinimized()) {
            libraryWindow.restore();
        } else if (!libraryWindow.isVisible()) {
            libraryWindow.close();
            return;
        }
        libraryWindow.show(); // focuses as well
    }

    yield put(readerActions.closeSuccess.build());
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
