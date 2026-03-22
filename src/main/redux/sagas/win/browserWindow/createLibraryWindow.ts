// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import debug_ from "debug";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { BrowserWindow, Event as ElectronEvent, HandlerDetails, shell, WebContentsWillNavigateEventParams } from "electron";
import * as path from "path";
import { defaultRectangle, normalizeRectangle } from "readium-desktop/common/rectangle/window";
import { setMenu } from "readium-desktop/main/menu";
import { winActions } from "readium-desktop/main/redux/actions";
import { winCommonActions } from "readium-desktop/common/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _RENDERER_LIBRARY_BASE_URL,
} from "readium-desktop/preprocessor-directives";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put } from "redux-saga/effects";
import { select as selectTyped, call as callTyped, put as putTyped, race as raceTyped, take as takeTyped, delay as delayTyped, spawn as spawnTyped, SagaGenerator } from "typed-redux-saga/macro";
import { buffers, END, eventChannel } from "redux-saga";

import { contextMenuSetup } from "@r2-navigator-js/electron/main/browser-window-tracker";
import { TIMEOUT_BROWSER_WINDOW_INITIALISATION, WINDOW_MIN_HEIGHT, WINDOW_MIN_WIDTH } from "readium-desktop/common/constant";
import { URL_PROTOCOL_FILEX, URL_HOST_COMMON } from "readium-desktop/common/streamerProtocol";
import { v4 as uuidv4 } from "uuid";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { getCatalog } from "../../catalog";
import { winIpc } from "readium-desktop/common/ipc";

// Logger
const debug = debug_("readium-desktop:createLibraryWindow");

const ENABLE_DEV_TOOLS = __TH__IS_DEV__ || __TH__IS_CI__;

// Global reference to the main window,
// so the garbage collector doesn't close it.
let libWindow: BrowserWindow = null;

// Opens the main window, with a native menu bar.
export function* createLibraryWindow() {

    // TODO: winBound from disk
    // initial state apply in reducers
    let windowBound = yield* selectTyped(
        (state: RootState) => state.win.session.library.windowBound);
    windowBound = normalizeRectangle(windowBound);
    if (!windowBound) {
        windowBound = defaultRectangle();
    }

    libWindow = new BrowserWindow({
        ...windowBound,
        minWidth: WINDOW_MIN_WIDTH,
        minHeight: WINDOW_MIN_HEIGHT,
        webPreferences: {
            // enableRemoteModule: false,
            allowRunningInsecureContent: false,
            backgroundThrottling: true,
            devTools: ENABLE_DEV_TOOLS, // this does not automatically open devtools, just enables them (see Electron API openDevTools())
            nodeIntegration: true, // ==> disables sandbox https://www.electronjs.org/docs/latest/tutorial/sandbox
            sandbox: false,
            contextIsolation: false, // must be false because nodeIntegration, see https://github.com/electron/electron/issues/23506
            nodeIntegrationInWorker: false,
            webSecurity: true,
            webviewTag: false,
        },
        icon: path.join(__dirname, "assets/icons/icon.png"),
    });

    if (ENABLE_DEV_TOOLS) {
        const wc = libWindow.webContents;
        contextMenuSetup(wc, wc.id);
    }

    const windowIdentifier = uuidv4();
    yield put(winActions.session.registerLibrary.build(libWindow, windowBound, windowIdentifier));

    const readers = yield* selectTyped(
        (state: RootState) => state.win.session.reader,
    );
    const readersArray = ObjectValues(readers);
    if (readersArray.length === 1) {
        libWindow.hide();
    }

    // const baseURLForDataURL: string | undefined = undefined;
    // let httpReferrer: string | undefined;
    let rendererBaseUrl = _RENDERER_LIBRARY_BASE_URL;
    const htmlPath = "index_library.html";
    if (rendererBaseUrl === `${URL_PROTOCOL_FILEX}://${URL_HOST_COMMON}/`) {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += path.normalize(path.join(__dirname, htmlPath)).replace(/\\/g, "/").split("/").map((segment) => encodeURIComponent_RFC3986(segment)).join("/");
        // baseURLForDataURL = rendererBaseUrl; // + "/../";
        // httpReferrer = rendererBaseUrl; // + "/../";
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += htmlPath;
        rendererBaseUrl = rendererBaseUrl.replace(/\\/g, "/");
    }

    const didFinishLoadEventChannel = eventChannel<true>(
        (emit) => {

            const handler = () => {
                emit(true);
                emit(END);
            };

            if (!libWindow.isDestroyed() && !libWindow.webContents.isDestroyed()) { // __TH__IS_DEV__
                libWindow.webContents.once("did-finish-load", handler);
            }

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

            if (!libWindow.isDestroyed() && !libWindow.webContents.isDestroyed()) { // __TH__IS_DEV__
                libWindow.webContents.once("did-fail-load", handler);
            }

            return () => {
            };
        },
        buffers.none(),
    );

    // detached background execution
    const initializationTask = yield* spawnTyped(function* () {
        const { success, error, timeout, closeLibrary } = yield* raceTyped({
            success: callTyped(function* (): SagaGenerator<true> {
                yield* takeTyped(didFinishLoadEventChannel);
                
                const webContents = libWindow.webContents;
                const state = yield* selectTyped((_state: RootState) => _state);

                const payload: Partial<ILibraryRootState> = {
                    i18n: state.i18n,
                    keyboard: state.keyboard,
                    theme: state.theme,
                    wizard: state.wizard,
                    win: {
                        identifier: windowIdentifier,
                    },
                    publication: {
                        catalog: {
                            entries: [],
                        },
                        tag: [],
                    },
                    session: {
                        // state: state.session.state,
                        // save: state.session.save,
                        save: false, // disabled
                    },
                    screenReader: {
                        activate: state.screenReader.activate,
                    },
                    creator: state.creator,
                    settings: state.settings,
                    lcp: state.lcp,
                    noteExport: state.noteExport,
                    customization: state.customization,
                };
                try {
                    const publication = yield* callTyped(getCatalog);
                    payload.publication = publication;
                } catch (e) {
                    // error(filename_, e);
                }
                // Send the id to the new window
                webContents.send(winIpc.CHANNEL, {
                    type: winIpc.EventType.IdResponse,
                    payload,
                } as winIpc.EventPayload);

                // yield* putTyped(winActions.library.openSucess.build(libWindow, windowIdentifier));
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
            closeLibrary: callTyped(function* (): SagaGenerator<true> {
                yield* takeTyped(winActions.session.unregisterLibrary.build);
                return true;
            }),
        });

        if (success) {
            debug(`Library Window Initialized and Ready - winId=${windowIdentifier}`);
        } else if (error) {
            debug(`Library Window Failed 'did-fail-load' event received - winId=${windowIdentifier}`);
            // yield* putTyped(winActions.library.openError.build(libWindow, windowIdentifier, "did-fail-load"));
        } else if (timeout) {
            debug("ERROR!!! CreatelibWindow TIMEOUT!!!");
            // yield* putTyped(winActions.library.openError.build(libWindow, windowIdentifier, "timeout"));
        } else if (closeLibrary) {
            debug(`Closing Library Window Requested before the end of the initialization - winId=${windowIdentifier}`);
        } else {
            debug("ASSERT ERROR UNREACHABLE");
        }

        return true;
    });

    // libWindow.webContents.on("did-finish-load", () => {

    //     // if (libWindow.isDestroyed() || libWindow.webContents.isDestroyed()) {
    //     //     debug("readerWindow or webcontents is destroyed !!");
    //     //     return; // Is it really needed to early return here, and block library openSuccess 
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
    //     //             .then((name: string) => debug("electron-devtools-installer OK (library window): ", name))
    //     //             .catch((err: Error) => debug("electron-devtools-installer ERROR (library window): ", err));
    //     //     });
    //     // }, 1000);

    //     // the dispatching of 'openSucess' action must be in the 'did-finish-load' event
    //     // because webpack-dev-server automaticaly refresh the window.
    //     const store = diMainGet("store");
    //     const identifier = store.getState().win.session.library.identifier;
    //     // const identifier = yield* selectTyped((state: RootState) => state.win.session.library.identifier);
    //     store.dispatch(winActions.library.openSucess.build(libWindow, identifier));

    // });

    // if (!__TH__IS_VSCODE_LAUNCH__ && OPEN_DEV_TOOLS) {
    //     setTimeout(() => {
    //         if (!libWindow.isDestroyed() && !libWindow.webContents.isDestroyed()) {
    //             debug("opening dev tools (library) ...");
    //             libWindow.webContents.openDevTools({ activate: true, mode: "detach" });
    //         }
    //     }, 2000);
    // }

    if (!libWindow.isDestroyed() && !libWindow.webContents.isDestroyed()) {
        yield* callTyped(async () => {

            if (!libWindow.isDestroyed()) {
                try {
                    await libWindow.loadURL(rendererBaseUrl /*, {baseURLForDataURL, httpReferrer} */);
                } catch (e) {
                    debug("Load url rejected", e);
                }
            } else {
                debug("cannot load url window destroyed");
            }
        });
        // the promise will resolve when the page has finished loading (see did-finish-load)
        // and rejects if the page fails to load (see did-fail-load).
    } else {
        debug("window destroyed !!");
    }


    // if (!__TH__IS_DEV__) {
    //     // see 'did-finish-load' otherwise
    //     const identifier = yield* selectTyped((state: RootState) => state.win.session.library.identifier);
    //     yield put(winActions.library.openSucess.build(libWindow, identifier));
    // }

    if (!libWindow.isDestroyed()) {
        try {
            setMenu(libWindow, false);
        } catch (e) {
            debug("Set menu error", e);
        }
    }

    const willNavigate = (navUrl: string | undefined | null) => {

        if (!navUrl) {
            debug("willNavigate ==> nil: ", navUrl);
            return;
        }

        if (/^https?:\/\//.test(navUrl)
            && !navUrl.startsWith("http://localhost") && !navUrl.startsWith("http://127.0.0.1")) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.

            debug("willNavigate ==> EXTERNAL: ", libWindow.webContents.getURL(), " *** ", navUrl);
            setTimeout(async () => {
                await shell.openExternal(navUrl);
            }, 0);

            return;
        }

        debug("willNavigate ==> noop: ", navUrl);
    };


    if (!libWindow.isDestroyed() && !libWindow.webContents.isDestroyed()) {
        libWindow.webContents.setWindowOpenHandler((details: HandlerDetails) => {
            debug("BrowserWindow.webContents.setWindowOpenHandler (always DENY): ", libWindow.webContents.id, " --- ", details.url, " === ", libWindow.webContents.getURL());

            // willNavigate(details.url);

            return { action: "deny" };
        });

        libWindow.webContents.on("will-navigate", (details: ElectronEvent<WebContentsWillNavigateEventParams>, url: string) => {
            debug("BrowserWindow.webContents.on('will-navigate') (always PREVENT): ", libWindow.webContents.id, " --- ", details.url, " *** ", url, " === ", libWindow.webContents.getURL());

            // if (details.url === libWindow.webContents.getURL()) {
            //     debug("will-navigate PASS", details.url);
            //     return;
            // }

            details.preventDefault();

            willNavigate(details.url);
        });
    }
    // Clear all cache to prevent weird behaviours
    // Fully handled in r2-navigator-js initSessions();
    // (including exit cleanup)
    // libWindow.webContents.session.clearStorageData();

    return initializationTask;
}
