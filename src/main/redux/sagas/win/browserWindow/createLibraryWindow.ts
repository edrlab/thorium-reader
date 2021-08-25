// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { BrowserWindow, Event, HandlerDetails, shell } from "electron";
import * as path from "path";
import { defaultRectangle, normalizeRectangle } from "readium-desktop/common/rectangle/window";
import { diMainGet } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _RENDERER_LIBRARY_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { contextMenuSetup } from "@r2-navigator-js/electron/main/browser-window-tracker";

// Logger
const debug = debug_("readium-desktop:createLibraryWindow");

// Global reference to the main window,
// so the garbage collector doesn't close it.
let libWindow: BrowserWindow = null;

// Opens the main window, with a native menu bar.
export function* createLibraryWindow(_action: winActions.library.openRequest.TAction) {

    // initial state apply in reducers
    let windowBound = yield* selectTyped(
        (state: RootState) => state.win.session.library.windowBound);
    windowBound = normalizeRectangle(windowBound);
    if (!windowBound) {
        windowBound = defaultRectangle();
    }

    libWindow = new BrowserWindow({
        ...windowBound,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            enableRemoteModule: false,
            backgroundThrottling: true,
            devTools: IS_DEV,
            nodeIntegration: true, // Required to use IPC
            contextIsolation: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
        icon: path.join(__dirname, "assets/icons/icon.png"),
    });

    if (IS_DEV) {
        const wc = libWindow.webContents;
        contextMenuSetup(wc, wc.id);

        libWindow.webContents.on("did-finish-load", () => {

            const {
                default: installExtension,
                REACT_DEVELOPER_TOOLS,
                REDUX_DEVTOOLS,
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            } = require("electron-devtools-installer");

            [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
                installExtension(extension)
                    .then((name: string) => debug("Added Extension: ", name))
                    .catch((err: Error) => debug("An error occurred: ", err));
            });

            // the dispatching of 'openSucess' action must be in the 'did-finish-load' event
            // because webpack-dev-server automaticaly refresh the window.
            const store = diMainGet("store");
            const identifier = store.getState().win.session.library.identifier;
            store.dispatch(winActions.library.openSucess.build(libWindow, identifier));

        });

        if (_VSCODE_LAUNCH !== "true") {
            setTimeout(() => {
                if (!libWindow.isDestroyed()) {
                    libWindow.webContents.openDevTools({ activate: true, mode: "detach" });
                }
            }, 2000);
        }
    }

    yield put(winActions.session.registerLibrary.build(libWindow, windowBound));

    const readers = yield* selectTyped(
        (state: RootState) => state.win.session.reader,
    );
    const readersArray = ObjectValues(readers);
    if (readersArray.length === 1) {
        libWindow.hide();
    }

    let rendererBaseUrl = _RENDERER_LIBRARY_BASE_URL;
    if (rendererBaseUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += path.normalize(path.join(__dirname, "index_library.html"));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += "index_library.html";
    }
    rendererBaseUrl = rendererBaseUrl.replace(/\\/g, "/");

    yield* callTyped(() => libWindow.loadURL(rendererBaseUrl));
    // the promise will resolve when the page has finished loading (see did-finish-load)
    // and rejects if the page fails to load (see did-fail-load).

    if (!IS_DEV) {
        // see 'did-finish-load' otherwise
        const identifier = yield* selectTyped((state: RootState) => state.win.session.library.identifier);
        yield put(winActions.library.openSucess.build(libWindow, identifier));
    }

    setMenu(libWindow, false);

    // Redirect link to an external browser
    const handleRedirect = async (event: Event, url: string) => {
        if (url === libWindow.webContents.getURL()) {
            return;
        }

        event.preventDefault();
        await shell.openExternal(url);
    };
    libWindow.webContents.on("will-navigate", handleRedirect);

    // https://www.electronjs.org/releases/stable?version=12&page=4#breaking-changes-1200
    // https://github.com/electron/electron/blob/main/docs/breaking-changes.md#deprecated-webcontents-new-window-event
    // libWindow.webContents.on("new-window", handleRedirect);
    libWindow.webContents.setWindowOpenHandler((details: HandlerDetails) => {
        if (details.url === libWindow.webContents.getURL()) {
            return { action: "allow" };
        }

        setTimeout(async () => {
            await shell.openExternal(details.url);
        }, 0);

        return { action: "deny" };
    });

    // Clear all cache to prevent weird behaviours
    // Fully handled in r2-navigator-js initSessions();
    // (including exit cleanup)
    // libWindow.webContents.session.clearStorageData();
}
