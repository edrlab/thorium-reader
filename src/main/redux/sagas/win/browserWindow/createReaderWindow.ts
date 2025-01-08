// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import * as debug_ from "debug";
import { BrowserWindow } from "electron";
import * as path from "path";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";
import { diMainGet, saveReaderWindowInDi } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { winActions } from "readium-desktop/main/redux/actions";
import {
    _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH, IS_DEV, OPEN_DEV_TOOLS, _CONTINUOUS_INTEGRATION_DEPLOY,
} from "readium-desktop/preprocessor-directives";

import {
    contextMenuSetup, trackBrowserWindow,
} from "@r2-navigator-js/electron/main/browser-window-tracker";

import { getPublication } from "../../api/publication/getPublication";
import { WINDOW_MIN_HEIGHT, WINDOW_MIN_WIDTH } from "readium-desktop/common/constant";

// Logger
const debug = debug_("readium-desktop:createReaderWindow");
debug("_");

const ENABLE_DEV_TOOLS = IS_DEV || _CONTINUOUS_INTEGRATION_DEPLOY;

export function* createReaderWindow(action: winActions.reader.openRequest.TAction) {

    const { winBound, publicationIdentifier, manifestUrl, identifier, reduxState } = action.payload;

    const readerWindow = new BrowserWindow({
        ...winBound,
        minWidth: WINDOW_MIN_WIDTH,
        minHeight: WINDOW_MIN_HEIGHT,
        webPreferences: {
            // enableRemoteModule: false,
            allowRunningInsecureContent: false,
            backgroundThrottling: false,
            devTools: ENABLE_DEV_TOOLS, // this does not automatically open devtools, just enables them (see Electron API openDevTools())
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: false,
            sandbox: false,
            webSecurity: true,
            webviewTag: true,
        },
        icon: path.join(__dirname, "assets/icons/icon.png"),
    });
    readerWindow.on("focus", () => {
        readerWindow.webContents?.send("window-focus");
    });
    readerWindow.on("blur", () => {
        readerWindow.webContents?.send("window-blur");
    });

    if (ENABLE_DEV_TOOLS) {
        const wc = readerWindow.webContents;
        contextMenuSetup(wc, wc.id);
    }

    const pathBase64 = manifestUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    const pathDecoded = Buffer.from(decodeURIComponent(pathBase64), "base64").toString("utf8");

    const publicationView = yield* getPublication(publicationIdentifier, false);

    const registerReaderAction = yield* putTyped(winActions.session.registerReader.build(
        readerWindow,
        publicationIdentifier,
        publicationView,
        manifestUrl,
        pathDecoded,
        winBound,
        reduxState,
        identifier,
    ));

    yield* callTyped(() => saveReaderWindowInDi(readerWindow, registerReaderAction.payload.identifier));

    // Track it
    trackBrowserWindow(readerWindow);

    let readerUrl = _RENDERER_READER_BASE_URL;
    const htmlPath = "index_reader.html";
    if (readerUrl === "filex://host/") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        readerUrl += path.normalize(path.join(__dirname, htmlPath)).replace(/\\/g, "/").split("/").map((segment) => encodeURIComponent_RFC3986(segment)).join("/");
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        readerUrl += htmlPath;
        readerUrl = readerUrl.replace(/\\/g, "/");
    }

    if (true) { // IS_DEV

        readerWindow.webContents.on("did-finish-load", () => {
            // see app.whenReady() in src/main/redux/sagas/app.ts
            // // app.whenReady().then(() => {
            // // });
            // setTimeout(() => {
            //     const {
            //         default: installExtension,
            //         REACT_DEVELOPER_TOOLS,
            //         REDUX_DEVTOOLS,
            //     // eslint-disable-next-line @typescript-eslint/no-var-requires
            //     } = require("electron-devtools-installer");

            //     [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
            //         installExtension(extension)
            //         .then((name: string) => debug("electron-devtools-installer OK (reader window): ", name))
            //         .catch((err: Error) => debug("electron-devtools-installer ERROR (reader window): ", err));
            //     });
            // }, 1000);

            // the dispatching of 'openSucess' action must be in the 'did-finish-load' event
            // because webpack-dev-server automaticaly refresh the window.
            const store = diMainGet("store");

            store.dispatch(winActions.reader.openSucess.build(readerWindow, registerReaderAction.payload.identifier));
        });
    }

    yield* callTyped(() => readerWindow.webContents.loadURL(readerUrl, { extraHeaders: "pragma: no-cache\n" }));

    // // TODO shouldn't the call to reader.openSucess be fenced with if (!IS_DEV) {}, just like in createlibraryWindow??
    // // (otherwise called a second time in did-finish-load event handler below)
    // if (!IS_DEV) {
    //     // see 'did-finish-load' otherwise
    //     yield* putTyped(winActions.reader.openSucess.build(readerWindow, registerReaderAction.payload.identifier));
    // }

    if (IS_DEV) {

        if (_VSCODE_LAUNCH !== "true" && OPEN_DEV_TOOLS) {
            setTimeout(() => {
                if (!readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) {
                    debug("opening dev tools (reader) ...");
                    readerWindow.webContents.openDevTools({ activate: true, mode: "detach" });
                }
            }, 2000);
        }
    }

    setMenu(readerWindow, true);

}
