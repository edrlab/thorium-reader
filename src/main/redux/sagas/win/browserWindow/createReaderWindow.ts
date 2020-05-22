// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow, Menu } from "electron";
import * as path from "path";
import { callTyped, putTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { diMainGet, saveReaderWindowInDi } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { winActions } from "readium-desktop/main/redux/actions";
import {
    _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";

import { trackBrowserWindow } from "@r2-navigator-js/electron/main/browser-window-tracker";

// Logger
const debug = debug_("readium-desktop:createReaderWindow");
debug("_");

export function* createReaderWindow(action: winActions.reader.openRequest.TAction) {

    const { winBound, publicationIdentifier, manifestUrl, identifier, reduxState } = action.payload;

    const readerWindow = new BrowserWindow({
        ...winBound,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            allowRunningInsecureContent: false,
            backgroundThrottling: false,
            contextIsolation: false,
            devTools: IS_DEV,
            nodeIntegration: true,
            nodeIntegrationInWorker: false,
            sandbox: false,
            webSecurity: true,
            webviewTag: true,
        },
        icon: path.join(__dirname, "assets/icons/icon.png"),
    });

    if (IS_DEV) {
        const wc = readerWindow.webContents;
        wc.on("context-menu", (_ev, params) => {
            const { x, y } = params;
            const openDevToolsAndInspect = () => {
                const devToolsOpened = () => {
                    wc.off("devtools-opened", devToolsOpened);
                    wc.inspectElement(x, y);

                    setTimeout(() => {
                        if (wc.isDevToolsOpened() && wc.devToolsWebContents) {
                            wc.devToolsWebContents.focus();
                        }
                    }, 500);
                };
                wc.on("devtools-opened", devToolsOpened);
                wc.openDevTools({ activate: true, mode: "detach" });
            };
            Menu.buildFromTemplate([{
                click: () => {
                    const wasOpened = wc.isDevToolsOpened();
                    if (!wasOpened) {
                        openDevToolsAndInspect();
                    } else {
                        if (!wc.isDevToolsFocused()) {
                            // wc.toggleDevTools();
                            wc.closeDevTools();

                            setImmediate(() => {
                                openDevToolsAndInspect();
                            });
                        } else {
                            // this should never happen,
                            // as the right-click context menu occurs with focus
                            // in BrowserWindow / WebView's WebContents
                            wc.inspectElement(x, y);
                        }
                    }
                },
                label: "Inspect element",
            }]).popup({window: readerWindow});
        });

    }

    const pathBase64 = manifestUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
    const pathDecoded = Buffer.from(decodeURIComponent(pathBase64), "base64").toString("utf8");

    const publicationApi = yield* callTyped(() => diMainGet("publication-api"));
    const publicationView = yield* callTyped(() => publicationApi.get(publicationIdentifier, false));

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

    if (readerUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        readerUrl += path.normalize(path.join(__dirname, htmlPath));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        readerUrl += htmlPath;
    }

    readerUrl = readerUrl.replace(/\\/g, "/");

    yield* callTyped(() => readerWindow.webContents.loadURL(readerUrl, { extraHeaders: "pragma: no-cache\n" }));

    yield* putTyped(winActions.reader.openSucess.build(readerWindow, registerReaderAction.payload.identifier));
    if (IS_DEV) {

        readerWindow.webContents.on("did-finish-load", () => {

            // the dispatching of 'openSuccess' action must be in the 'did-finish-load' event
            // because webpack-dev-server automaticaly refresh the window.
            const store = diMainGet("store");

            store.dispatch(winActions.reader.openSucess.build(readerWindow, registerReaderAction.payload.identifier));

        });
    }

    if (_VSCODE_LAUNCH !== "true") {
        setTimeout(() => {

            // tslint:disable-next-line: max-line-length
            // https://github.com/readium/readium-desktop/commit/c38cbd4860c84334f182d5059fb93107cd8ed709#diff-b35e0b23967fd130d41571c2e35859ff
            if (!readerWindow.isDestroyed()) {
                readerWindow.webContents.openDevTools({ activate: true, mode: "detach" });
            }
        }, 2000);
    }

    setMenu(readerWindow, true);

}
