// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { BrowserWindow, Event, Menu, shell } from "electron";
import * as path from "path";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import {
    _PACKAGING, _RENDERER_LIBRARY_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { put } from "redux-saga/effects";

// import { put } from "typed-redux-saga";
import { setMenu } from "../../../../menu";
import { winActions } from "../../../actions";
import { RootState } from "../../../states";

// Logger
const debug = debug_("readium-desktop:createLibraryWindow");

// Global reference to the main window,
// so the garbage collector doesn't close it.
let libWindow: BrowserWindow = null;

// Opens the main window, with a native menu bar.
export function* createLibraryWindow() {

    // initial state apply in reducers
    const windowBound = yield* selectTyped(
        (state: RootState) => state.win.session.library.windowBound);

    libWindow = new BrowserWindow({
        ...windowBound,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            devTools: IS_DEV,
            nodeIntegration: true, // Required to use IPC
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
        icon: path.join(__dirname, "assets/icons/icon.png"),
    });

    if (IS_DEV) {
        libWindow.webContents.on("context-menu", (_ev, params) => {
            const { x, y } = params;
            Menu.buildFromTemplate([{
                label: "Inspect element",
                click: () => {
                    libWindow.webContents.inspectElement(x, y);
                },
            }]).popup({window: libWindow});
        });

        libWindow.webContents.on("did-finish-load", () => {
            const {
                default: installExtension,
                REACT_DEVELOPER_TOOLS,
                REDUX_DEVTOOLS,
            } = require("electron-devtools-installer");

            [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
                installExtension(extension)
                    .then((name: string) => debug("Added Extension: ", name))
                    .catch((err: Error) => debug("An error occurred: ", err));
            });
        });

        if (_VSCODE_LAUNCH !== "true") {
            libWindow.webContents.openDevTools({ mode: "detach" });
        }
    }

    yield put(winActions.session.registerLibrary.build(libWindow));

    let rendererBaseUrl = _RENDERER_LIBRARY_BASE_URL;
    if (rendererBaseUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += path.normalize(path.join(__dirname, "index_library.html"));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += "index_library.html";
    }
    rendererBaseUrl = rendererBaseUrl.replace(/\\/g, "/");

    libWindow.loadURL(rendererBaseUrl);

    setMenu(libWindow, false);

    // Redirect link to an external browser
    const handleRedirect = (event: Event, url: string) => {
        if (url === libWindow.webContents.getURL()) {
            return;
        }

        event.preventDefault();
        shell.openExternal(url);
    };

    libWindow.webContents.on("will-navigate", handleRedirect);
    libWindow.webContents.on("new-window", handleRedirect);

    // Clear all cache to prevent weird behaviours
    // Fully handled in r2-navigator-js initSessions();
    // (including exit cleanup)
    // libWindow.webContents.session.clearStorageData();
}
