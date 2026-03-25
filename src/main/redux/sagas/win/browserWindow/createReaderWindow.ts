// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import debug_ from "debug";
import { BrowserWindow, Event as ElectronEvent, HandlerDetails, shell, WebContentsWillNavigateEventParams } from "electron";
import * as path from "path";
import { call as callTyped, put as putTyped, race as raceTyped, take as takeTyped, delay as delayTyped, spawn as spawnTyped, fork as forkTyped, SagaGenerator } from "typed-redux-saga/macro";
import { buffers, END, eventChannel } from "redux-saga";
import { diMainGet, saveReaderWindowInDi } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { winActions } from "readium-desktop/main/redux/actions";
import {
    _RENDERER_READER_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import {
    contextMenuSetup, trackBrowserWindow,
} from "@r2-navigator-js/electron/main/browser-window-tracker";

import { getPublication } from "../../api/publication/getPublication";
import { TIMEOUT_BROWSER_WINDOW_INITIALISATION, WINDOW_MIN_HEIGHT, WINDOW_MIN_WIDTH } from "readium-desktop/common/constant";
import { URL_PROTOCOL_FILEX, URL_HOST_COMMON } from "readium-desktop/common/streamerProtocol";
import { readerNewWindowBound } from "../../reader";
import { winCommonActions } from "readium-desktop/common/redux/actions";

// Logger
const debug = debug_("readium-desktop:createReaderWindow");
debug("_");

const isUUIDv4 = (uuid: string) => /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(uuid);
const assertUUIDv4 = (uuid: string) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};

const ENABLE_DEV_TOOLS = __TH__IS_DEV__ || __TH__IS_CI__;

export function* createReaderWindow(publicationIdentifier: string, manifestUrl: string,  windowIdentifier: string /* winBound, reduxState*/) {
    assertUUIDv4(windowIdentifier);
    assertUUIDv4(publicationIdentifier);
    
    const winBound = yield* callTyped(readerNewWindowBound, publicationIdentifier);
    const readerWindow = new BrowserWindow({
        ...winBound,
        minWidth: WINDOW_MIN_WIDTH,
        minHeight: WINDOW_MIN_HEIGHT,
        webPreferences: {
            // enableRemoteModule: false,
            allowRunningInsecureContent: false,
            backgroundThrottling: false,
            devTools: ENABLE_DEV_TOOLS, // this does not automatically open devtools, just enables them (see Electron API openDevTools())
            nodeIntegration: true, // ==> disables sandbox https://www.electronjs.org/docs/latest/tutorial/sandbox
            sandbox: false,
            contextIsolation: false, // must be false because nodeIntegration, see https://github.com/electron/electron/issues/23506
            nodeIntegrationInWorker: false,
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

    yield* putTyped(winActions.session.registerReader.build(
        readerWindow,
        publicationIdentifier,
        publicationView,
        manifestUrl,
        pathDecoded,
        winBound,
        // reduxState,
        windowIdentifier,
    ));
    yield* forkTyped(() => diMainGet("publication-data").writeJsonObj(publicationIdentifier, "bound", winBound));

    saveReaderWindowInDi(readerWindow, windowIdentifier);

    // Track it
    trackBrowserWindow(readerWindow);

    let readerUrl = _RENDERER_READER_BASE_URL;
    const htmlPath = "index_reader.html";
    if (readerUrl === `${URL_PROTOCOL_FILEX}://${URL_HOST_COMMON}/`) {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        readerUrl += path.normalize(path.join(__dirname, htmlPath)).replace(/\\/g, "/").split("/").map((segment) => encodeURIComponent_RFC3986(segment)).join("/");
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        readerUrl += htmlPath;
        readerUrl = readerUrl.replace(/\\/g, "/");
    }

    if (!readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) { // __TH__IS_DEV__

        const didFinishLoadEventChannel = eventChannel<true>(
            (emit) => {

                const handler = () => {
                    emit(true);
                    emit(END);
                };
                readerWindow.webContents.once("did-finish-load", handler);

                return () => {
                };
            },
            buffers.none(),
        );
        const didFailLoadEventChannel = eventChannel<true>(
            (emit) => {

                const handler = () => {
                    emit(true);
                    emit(END);
                };

                readerWindow.webContents.once("did-fail-load", handler);

                return () => {
                };
            },
            buffers.none(),
        );

        // detached background execution
        yield* spawnTyped(function*() {
            const { success, error, timeout, closeReader } = yield* raceTyped({
                success: callTyped(function* (): SagaGenerator<true> {
                    yield* takeTyped(didFinishLoadEventChannel);
                    yield* putTyped(winActions.reader.openSucess.build(readerWindow, windowIdentifier, publicationIdentifier));
                    yield* callTyped(function* () {
                            while (true) {
                                const action = yield* takeTyped(winCommonActions.initSuccess.build);
                                const winIdReceived = action.sender?.identifier;
                                if (winIdReceived === windowIdentifier) {
                                    return true;
                                }
                            }
                    });
                    return true;
                }),
                error: takeTyped(didFailLoadEventChannel),
                timeout: delayTyped(TIMEOUT_BROWSER_WINDOW_INITIALISATION),
                closeReader: callTyped(function*(): SagaGenerator<true> {
                    while (true) {
                        const action = yield* takeTyped(winActions.session.unregisterReader.build);
                        const winIdReceived = action.payload.windowIdentifier;
                        if (winIdReceived === windowIdentifier) {
                            return true;
                        }
                    }
                }),
            });

            if (success) {
                debug(`Reader Window Initialized and Ready - winId=${windowIdentifier} pubId=${publicationIdentifier}`);
            } else if (error) {
                debug(`Reader Window Failed 'did-fail-load' event received - winId=${windowIdentifier} pubId=${publicationIdentifier}`);
                yield* putTyped(winActions.reader.openError.build(readerWindow, windowIdentifier, publicationIdentifier, "did-fail-load"));
            } else if (timeout) {
                debug("ERROR!!! CreateReaderWindow TIMEOUT!!!");
                yield* putTyped(winActions.reader.openError.build(readerWindow, windowIdentifier, publicationIdentifier, "timeout"));
            } else if (closeReader) {
                debug(`Closing Reader Window Requested before the end of the initialization - winId=${windowIdentifier} pubId=${publicationIdentifier}`);
            } else {
                debug("ASSERT ERROR UNREACHABLE");
            }
        });
        // readerWindow.webContents.once("did-finish-load", () => {
        //     // if (readerWindow.isDestroyed() || readerWindow.webContents.isDestroyed()) {
        //     //     debug("readerWindow or webcontents is destroyed !!");
        //     //     return; // Is it really needed to early return here, and block reader openSuccess 
        //     // }
        //     // see app.whenReady() in src/main/redux/sagas/app.ts
        //     // // app.whenReady().then(() => {
        //     // // });
        //     // setTimeout(() => {
        //     //     const {
        //     //         default: installExtension,
        //     //         REACT_DEVELOPER_TOOLS,
        //     //         REDUX_DEVTOOLS,
        //     //     // eslint-disable-next-line @typescript-eslint/no-var-requires
        //     //     } = require("electron-devtools-installer");
        //     //     [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
        //     //         installExtension(extension)
        //     //         .then((name: string) => debug("electron-devtools-installer OK (reader window): ", name))
        //     //         .catch((err: Error) => debug("electron-devtools-installer ERROR (reader window): ", err));
        //     //     });
        //     // }, 1000);
        //     // the dispatching of 'openSucess' action must be in the 'did-finish-load' event
        //     // because webpack-dev-server automaticaly refresh the window.
        //     const store = diMainGet("store");
        //     // TODO: handle the error case 
        //     store.dispatch(winActions.reader.openSucess.build(readerWindow, windowIdentifier, publicationIdentifier));
        // });
    }

    if (!readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) { // __TH__IS_DEV__
        yield* callTyped(async () => {

            if (!readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) {
                try {
                    await readerWindow.webContents.loadURL(readerUrl, { extraHeaders: "pragma: no-cache\n" });
                } catch (e) {
                    debug("Load url rejected", e);
                };
            } else {
                debug("cannot load url windows destroyed");
            }
        });
    } else {
        debug("window destroyed !!");
    }

    // // TODO shouldn't the call to reader.openSucess be fenced with if (!__TH__IS_DEV__) {}, just like in createlibraryWindow??
    // // (otherwise called a second time in did-finish-load event handler below)
    // if (!__TH__IS_DEV__) {
    //     // see 'did-finish-load' otherwise
    //     yield* putTyped(winActions.reader.openSucess.build(readerWindow, registerReaderAction.payload.identifier));
    // }

    // if (__TH__IS_DEV__) {

    //     if (!__TH__IS_VSCODE_LAUNCH__ && OPEN_DEV_TOOLS) {
    //         setTimeout(() => {
    //             if (!readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) {
    //                 debug("opening dev tools (reader) ...");
    //                 readerWindow.webContents.openDevTools({ activate: true, mode: "detach" });
    //             }
    //         }, 2000);
    //     }
    // }

    setMenu(readerWindow, true);

    const willNavigate = (navUrl: string | undefined | null) => {

        if (!navUrl) {
            debug("willNavigate ==> nil: ", navUrl);
            return;
        }

        if (/^https?:\/\//.test(navUrl)
            && !navUrl.startsWith("http://localhost") && !navUrl.startsWith("http://127.0.0.1")) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.

            debug("willNavigate ==> EXTERNAL: ", readerWindow.webContents.getURL(), " *** ", navUrl);
            setTimeout(async () => {
                await shell.openExternal(navUrl);
            }, 0);

            return;
        }

        debug("willNavigate ==> noop: ", navUrl);
    };

    if (!readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) {

        readerWindow.webContents.setWindowOpenHandler((details: HandlerDetails) => {
            debug("BrowserWindow.webContents.setWindowOpenHandler (always DENY): ", readerWindow.webContents.id, " --- ", details.url, " === ", readerWindow.webContents.getURL());
    
            // willNavigate(details.url);
    
            return { action: "deny" };
        });
        readerWindow.webContents.on("will-navigate", (details: ElectronEvent<WebContentsWillNavigateEventParams>, url: string) => {
            debug("BrowserWindow.webContents.on('will-navigate') (always PREVENT): ", readerWindow.webContents.id, " --- ", details.url, " *** ", url, " === ", readerWindow.webContents.getURL());
        
            // if (details.url === readerWindow.webContents.getURL()) {
            //     debug("will-navigate PASS", details.url);
            //     return;
            // }
        
            details.preventDefault();
        
            willNavigate(details.url);
        });
    }    
}
