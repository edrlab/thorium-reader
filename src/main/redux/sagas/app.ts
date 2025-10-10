// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, ipcMain, net, session } from "electron";
import * as path from "path";
import { pathToFileURL } from "url";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { tryDecodeURIComponent } from "readium-desktop/common/utils/uri";
import { closeProcessLock, diMainGet, getLibraryWindowFromDi, getAllReaderWindowFromDi } from "readium-desktop/main/di";
import { getOpdsNewCatalogsStringUrlChannel } from "readium-desktop/main/event";
import {
    absorbDBToJson as absorbDBToJsonCookieJar, fetchCookieJarPersistence,
} from "readium-desktop/main/network/fetch";
import { absorbDBToJson as absorbDBToJsonOpdsAuth } from "readium-desktop/main/network/http";
import { needToPersistFinalState } from "readium-desktop/main/redux/sagas/persist";
import { error } from "readium-desktop/main/tools/error";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, race, spawn, take } from "redux-saga/effects";
import { delay as delayTyped, put as putTyped, race as raceTyped } from "typed-redux-saga/macro";

import { clearSessions } from "@r2-navigator-js/electron/main/sessions";

import { streamerActions } from "../actions";
import {
    getBeforeQuitEventChannel, getQuitEventChannel, getShutdownEventChannel,
    getWindowAllClosedEventChannel,
} from "./getEventChannel";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { i18nActions } from "readium-desktop/common/redux/actions";

// Logger
const filename_ = "readium-desktop:main:saga:app";
const debug = debug_(filename_);

export function* init() {

    app.setAppUserModelId("io.github.edrlab.thorium");

    // https://www.electronjs.org/fr/docs/latest/api/app#appsetasdefaultprotocolclientprotocol-path-args
    // https://www.electron.build/generated/platformspecificbuildoptions
    // Define custom protocol handler. Deep linking works on packaged versions of the application!

    if (__TH__IS_DEV__) {
        const electronPath = process.execPath;
        const appPath = app.getAppPath();

        if (!app.isDefaultProtocolClient("opds", electronPath, [appPath])) {
            app.setAsDefaultProtocolClient("opds", electronPath, [appPath]);
        }

        if (!app.isDefaultProtocolClient("thorium", electronPath, [appPath])) {
            app.setAsDefaultProtocolClient("thorium", electronPath, [appPath]);
        }
    } else {
        if (!app.isDefaultProtocolClient("opds")) {
            app.setAsDefaultProtocolClient("opds");
        }

        if (!app.isDefaultProtocolClient("thorium")) {
            app.setAsDefaultProtocolClient("thorium");
        }
    }

    // moved to saga/persist.ts
    // app.on("window-all-closed", async () => {
    //     // At the moment, there are no menu items to revive / re-open windows,
    //     // so let's terminate the app on MacOS too.
    //     // if (process.platform !== "darwin") {
    //     //     app.quit();
    //     // }

    //     setTimeout(() => app.exit(0), 2000);
    // });

    app.on("accessibility-support-changed", (_e, accessibilitySupportEnabled) => {
        console.log("app.on - accessibility-support-changed: ", accessibilitySupportEnabled);
        if (app.accessibilitySupportEnabled !== accessibilitySupportEnabled) { // .isAccessibilitySupportEnabled()
            console.log("!!?? app.accessibilitySupportEnabled !== app.on - accessibility-support-changed");
        }
        const browserWindows = [];
        try {
            const libraryWin = getLibraryWindowFromDi();
            if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed()) {
                browserWindows.push(libraryWin);
            }
        } catch (e) {
            debug("getLibraryWindowFromDi ERROR?", e);
        }
        try {
            const readerWins = getAllReaderWindowFromDi();
            if (readerWins?.length) {
                for (const readerWin of readerWins) {
                    if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {
                        browserWindows.push(readerWin);
                    }
                }
            }
        } catch (e) {
            debug("getAllReaderWindowFromDi ERROR?", e);
        }
        browserWindows.forEach((win) => {
            if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
                const store = diMainGet("store");
                const screenReaderActivated = store.getState().screenReader.activate;
                console.log("webContents.send - accessibility-support-changed: ", accessibilitySupportEnabled, screenReaderActivated, win.id);
                try {
                    win.webContents.send("accessibility-support-changed", accessibilitySupportEnabled && screenReaderActivated);
                } catch (e) {
                    debug("webContents.send - accessibility-support-changed ERROR?", e);
                }
            }
        });
    });
    // note that "@r2-navigator-js/electron/main/browser-window-tracker"
    // uses "accessibility-support-changed" instead of "accessibility-support-query",
    // so there is no duplicate event handler.
    ipcMain.on("accessibility-support-query", (e) => {
        const accessibilitySupportEnabled = app.accessibilitySupportEnabled; // .isAccessibilitySupportEnabled()
        const store = diMainGet("store");
        const screenReaderActivated = store.getState().screenReader.activate;
        console.log("ipcMain.on - accessibility-support-query, sender.send - accessibility-support-changed: ", accessibilitySupportEnabled, screenReaderActivated);
        e.sender.send("accessibility-support-changed", accessibilitySupportEnabled && screenReaderActivated);
    });

    yield call(() => app.whenReady());

    debug("Main app ready");

    const protocolHandler_FILEX = (
        request: Request,
    ): Response | Promise<Response> => {
        debug("---protocolHandler_FILEX");
        debug(request);
        const urlPath = request.url.substring("filex://host/".length);
        debug(urlPath);
        const urlPathDecoded = urlPath.split("/").map((segment) => {
            return segment?.length ? tryDecodeURIComponent(segment) : "";
        }).join("/");
        debug(urlPathDecoded);
        const filePathUrl = pathToFileURL(urlPathDecoded).toString();
        debug(filePathUrl);
        return net.fetch(filePathUrl); // potential security hole: local filesystem access (mitigated by URL scheme not .registerSchemesAsPrivileged() and not .handle() or .registerXXXProtocol() directly on r2-navigator-js.getWebViewSession().protocol or any other partitioned session, unlike Electron.protocol and Electron.session.defaultSession.protocol)
    };
    session.defaultSession.protocol.handle("filex", protocolHandler_FILEX);
    // protocol.unhandle("filex");

    if (__TH__IS_DEV__) {
        // https://github.com/MarshallOfSound/electron-devtools-installer
        // https://github.com/facebook/react/issues/25843
        // https://github.com/electron/electron/issues/36545
        // https://github.com/mondaychen/react/commit/f7d56173f1b751b0b7e2e47cc79a871887df5483

        // REACT_DEVELOPER_TOOLS ==> fmkadmapgofadopljbjfkapdkoienihi
        //     const PATH_TO_EXT = path.join(os.homedir(), "/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.27.0_0")
        //     const PATH_TO_EXT = path.join(os.homedir(), "/Library/Application Support/EDRLab.ThoriumReader/extensions/fmkadmapgofadopljbjfkapdkoienihi")
        // app.whenReady().then(() => {
        //     require("electron").session.defaultSession.loadExtension(PATH_TO_EXT, { loadExtensionOptions: { allowFileAccess: true } });
        // });
        const {
            default: installExtension,
            REACT_DEVELOPER_TOOLS,
            REDUX_DEVTOOLS,
        // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
        } = require("electron-devtools-installer");

        [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((extension) => {
            installExtension(extension /*, { loadExtensionOptions: { allowFileAccess: true } } */)
            .then((ext: {name: string}) => debug("electron-devtools-installer OK (app init): ", ext.name))
            .catch((err: Error) => debug("electron-devtools-installer ERROR (app init): ", err));
        });
    }

    const protocolHandler_Store = (
        request: Request,
    ): Response | Promise<Response> => {
        debug("---protocolHandler_Store");
        debug(request);
        const urlPath = request.url.substring("store://".length);
        debug(urlPath);
        // const urlPathDecoded = tryDecodeURIComponent(urlPath);
        // debug(urlPathDecoded);
        const pubStorage = diMainGet("publication-storage");
        const rootPath = pubStorage.getRootPath();
        debug(rootPath);
        const filePath = path.join(rootPath, urlPath);
        debug(filePath);
        const filePathUrl = pathToFileURL(filePath).toString();
        debug(filePathUrl);
        return net.fetch(filePathUrl); // potential security hole: local filesystem access (mitigated by URL scheme not .registerSchemesAsPrivileged() and not .handle() or .registerXXXProtocol() directly on r2-navigator-js.getWebViewSession().protocol or any other partitioned session, unlike Electron.protocol and Electron.session.defaultSession.protocol)
    };
    session.defaultSession.protocol.handle("store", protocolHandler_Store);
    // protocol.unhandle("store");

    app.on("will-quit", () => {

        debug("#####");
        debug("will-quit");
        debug("#####");
    });

    // Electron.protocol === Electron.session.defaultSession.protocol
    const pdfSession = session.fromPartition("persist:partitionpdfjsextract", { cache: false });

    const protocolHandler_PDF = (
        request: Request,
    ): Response | Promise<Response> => {
        debug("---protocolHandler_PDF");
        debug(request);
        const urlPath = request.url.substring("pdfjs-extract://host/".length);
        debug(urlPath);
        const urlPathDecoded = tryDecodeURIComponent(urlPath);
        debug(urlPathDecoded);
        const filePathUrl = pathToFileURL(urlPathDecoded).toString();
        debug(filePathUrl);
        return net.fetch(filePathUrl); // potential security hole: local filesystem access (mitigated by URL scheme not .registerSchemesAsPrivileged() and not .handle() or .registerXXXProtocol() directly on r2-navigator-js.getWebViewSession().protocol or any other partitioned session, unlike Electron.protocol and Electron.session.defaultSession.protocol)
    };
    pdfSession.protocol.handle("pdfjs-extract", protocolHandler_PDF);
    // protocol.unhandle("pdfjs-extract");

    // FAIL because of unsupported scheme protocol, even if exposed globally in the default session:
    // fetch("pdfjs-extract://host/%2Fpath%2Fto%2Ffile").then((r)=>r.statusCode).then((t)=>console.log(t)).catch((e)=>{console.log(e)});

    // WORKS with non-partitioned BrowserWindow or WebView (CORS):
    // const x = new XMLHttpRequest();
    // x.open("GET", "pdfjs-extract://host/%2Fpath%2Fto%2Ffile");
    // //x.responseType = "arraybuffer";
    // x.responseType = "text";
    // x.onerror = () => {
    //     console.log("X ERROR", x.readyState, x.status, typeof x.response);
    // };
    // x.onreadystatechange = () => {
    //     console.log("X STATECHANGE", x.readyState, x.status, typeof x.response, x.readyState === 4 ? x.response : undefined);
    // };
    // x.onprogress = () => {
    //     console.log("X PROGRESS", x.readyState, x.status, typeof x.response);
    // };
    // x.send(null);

    yield call(() => {
        const deviceIdManager = diMainGet("device-id-manager");
        return deviceIdManager.absorbDBToJson();
    });

    yield call(() => {
        const lcpManager = diMainGet("lcp-manager");
        return lcpManager.absorbDBToJson();
    });

    yield call(() => {
        return absorbDBToJsonCookieJar();
    });

    yield call(() => {
        return absorbDBToJsonOpdsAuth();
    });

    const envName = "THORIUM_OPDS_CATALOGS_URL";
    debug("SEARCH FROM ENV=", envName);
    try {

        const opdsCatalogsChan = getOpdsNewCatalogsStringUrlChannel();
        const catalogsUrl = process.env[envName];

        debug("CATALOGS URL FROM ENV FOUND =>", catalogsUrl);
        if (catalogsUrl) {
            const u = new URL(catalogsUrl);
            if (u)
                opdsCatalogsChan.put(catalogsUrl);
        }
    } catch (e) {

        //
        debug("CATALOGS URL FROM ENV NOT FOUND", e);
    }

    // i18n setLocale first initialization
    yield call(() => {
        const store = diMainGet("store");
        const locale = store.getState().i18n.locale as keyof typeof availableLanguages | "";
        if (locale === "") {

            const isAnAvailableLanguage = (a: string): a is keyof typeof availableLanguages => a in availableLanguages;
            for (const bcp47 of app.getPreferredSystemLanguages()) {
                if (isAnAvailableLanguage(bcp47)) {
                    store.dispatch(i18nActions.setLocale.build(bcp47));
                    return;
                }
                const lang = bcp47.split("-")[0];
                if (isAnAvailableLanguage(lang)) {
                    store.dispatch(i18nActions.setLocale.build(lang));
                    return;
                }
            }

            store.dispatch(i18nActions.setLocale.build("en")); // default language
        }
    });
}

function* closeProcess() {

    closeProcessLock.lock();
    try {
        const [done] = yield* raceTyped([
            all([
                call(function*() {

                    try {
                        // clear session in r2-navigator
                        yield call(clearSessions);
                        debug("Success to clearSession in r2-navigator");
                    } catch (e) {
                        debug("ERROR to clearSessions", e);
                    }
                }),
                call(function*() {

                    try {
                        yield call(fetchCookieJarPersistence);
                        debug("Success to persist fetch cookieJar");
                    } catch (e) {
                        debug("ERROR to persist fetch cookieJar", e);
                    }

                    try {
                        yield call(needToPersistFinalState);
                        debug("Success to persistState");
                    } catch (e) {
                        debug("ERROR to persistState", e);
                    }
                }),
                call(function*() {

                    yield* putTyped(streamerActions.stopRequest.build());

                    const [success, failed] = yield race([
                        take(streamerActions.stopSuccess.ID),
                        take(streamerActions.stopError.ID),
                    ]);
                    if (success) {
                        debug("Success to stop streamer");
                    } else {
                        debug("ERROR to stop streamer", failed);
                    }
                }),
            ]),
            delayTyped(30000), // 30 seconds timeout to force quit
        ]);

        if (!done) {
            debug("close process takes time to finish -> Force quit with 30s timeout");
        }
    } finally {

        closeProcessLock.release();
    }
}

export function exit() {
    return spawn(function*() {

        const beforeQuitEventChannel = getBeforeQuitEventChannel();
        const shutdownEventChannel = getShutdownEventChannel();
        const windowAllClosedEventChannel = getWindowAllClosedEventChannel();
        const quitEventChannel = getQuitEventChannel();
        let shouldExit = process.platform !== "darwin" || __TH__IS_DEV__;

        /*
        // events order :
        - before-quit
        - window-all-closed
        - quit
         */

        const exitNow = () => {

            debug("EXIT NOW");
            app.exit(0);
        };

        const closeLibWinAndExit = () => {

            // track ctrl-q/command-q
            shouldExit = true;

            const libraryWin = getLibraryWindowFromDi();
            if (process.platform === "darwin") {
                if (libraryWin.isDestroyed() || libraryWin.webContents.isDestroyed()) {
                    if (closeProcessLock.isLock) {
                        error(filename_, new Error(
                            `closing process not completed
                            ${_APP_NAME} tries to close properly, wait a few seconds`));
                    } else {
                        exitNow();
                    }
                    return ;
                }
            }

            if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed()) {
                libraryWin.close();
            }
        };

        yield takeSpawnEveryChannel(
            beforeQuitEventChannel,
            (e: Electron.Event) => {

                debug("#####");
                debug("#####");
                debug("#####");

                debug("before-quit");

                debug("#####");
                debug("#####");
                debug("#####");

                e.preventDefault();

                closeLibWinAndExit();
            },
        );

        yield takeSpawnEveryChannel(
            shutdownEventChannel,
            (e: Electron.Event) => {

                debug("#####");
                debug("#####");
                debug("#####");

                debug("shutdown");

                debug("#####");
                debug("#####");
                debug("#####");

                e.preventDefault();

                closeLibWinAndExit();
            },
        );

        yield takeSpawnEveryChannel(
            windowAllClosedEventChannel,
            function*() {

                debug("#####");
                debug("#####");
                debug("#####");

                debug("window-all-closed");

                debug("#####");
                debug("#####");
                debug("#####");

                yield call(closeProcess);

                if (shouldExit) {
                    exitNow();
                }
            },
        );

        yield takeSpawnEveryChannel(
            quitEventChannel,
            function*() {

                debug("#####");
                debug("#####");
                debug("#####");

                debug("quit");

                debug("#####");
                debug("#####");
                debug("#####");
            },
        );
    });
}
