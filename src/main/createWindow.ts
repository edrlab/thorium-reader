// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { app, BrowserWindow, Event, Menu, shell } from "electron";
import * as path from "path";
import { AppWindowType } from "readium-desktop/common/models/win";
import { getWindowsRectangle } from "readium-desktop/common/rectangle/window";
import { diMainGet } from "readium-desktop/main/di";
import {
    _PACKAGING, _RENDERER_APP_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";

import { setMenu } from "./menu";

// Logger
const debug = debug_("readium-desktop:createWindow");

// Global reference to the main window,
// so the garbage collector doesn't close it.
let mainWindow: BrowserWindow = null;

// Opens the main window, with a native menu bar.
export async function createWindow() {
    mainWindow = new BrowserWindow({
        ...(await getWindowsRectangle()),
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
        mainWindow.webContents.on("context-menu", (_ev, params) => {
            const { x, y } = params;
            Menu.buildFromTemplate([{
                label: "Inspect element",
                click: () => {
                    mainWindow.webContents.inspectElement(x, y);
                },
            }]).popup({window: mainWindow});
        });

        mainWindow.webContents.on("did-finish-load", () => {
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
            mainWindow.webContents.openDevTools({ mode: "detach" });
        }
    }

    const winRegistry = diMainGet("win-registry");
    const appWindow = winRegistry.registerWindow(mainWindow, AppWindowType.Library);

    // watch to record window rectangle position in the db
    appWindow.onWindowMoveResize.attach();

    let rendererBaseUrl = _RENDERER_APP_BASE_URL;

    if (rendererBaseUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += path.normalize(path.join(__dirname, "index_app.html"));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += "index_app.html";
    }

    rendererBaseUrl = rendererBaseUrl.replace(/\\/g, "/");

    mainWindow.loadURL(rendererBaseUrl);

    setMenu(mainWindow, false);

    // Redirect link to an external browser
    const handleRedirect = (event: Event, url: string) => {
        if (url === mainWindow.webContents.getURL()) {
            return;
        }

        event.preventDefault();
        shell.openExternal(url);
    };

    mainWindow.webContents.on("will-navigate", handleRedirect);
    mainWindow.webContents.on("new-window", handleRedirect);

    // Clear all cache to prevent weird behaviours
    // Fully handled in r2-navigator-js initSessions();
    // (including exit cleanup)
    // mainWindow.webContents.session.clearStorageData();

    mainWindow.on("closed", () => {
        // note that winRegistry still contains a reference to mainWindow, so won't necessarily be garbage-collected
        mainWindow = null;
    });
}

// On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other
// windows open.
app.on("activate", async () => {
    if (mainWindow === null) {
        await createWindow();
    }
});
