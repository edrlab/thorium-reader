// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, protocol } from "electron";
import * as path from "path";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { raceTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import {
    closeProcessLock, compactDb, diMainGet, getLibraryWindowFromDi,
} from "readium-desktop/main/di";
import { error } from "readium-desktop/main/error";
import { fetchCookieJarPersistence } from "readium-desktop/main/network/fetch";
import { needToPersistState } from "readium-desktop/main/redux/sagas/persist.ts";
import { _APP_NAME, _PACKAGING, IS_DEV } from "readium-desktop/preprocessor-directives";
import { all, call, race, spawn, take } from "redux-saga/effects";
import { delay, put } from "typed-redux-saga";

import { clearSessions } from "@r2-navigator-js/electron/main/sessions";

import { streamerActions } from "../actions";
import {
    getBeforeQuitEventChannel, getQuitEventChannel, getShutdownEventChannel,
    getWindowAllClosedEventChannel,
    initRequestCustomProtocolEventChannel,
} from "./getEventChannel";

// Logger
const filename_ = "readium-desktop:main:saga:app";
const debug = debug_(filename_);

export function* init() {

    app.setAppUserModelId("io.github.edrlab.thorium");

    // moved to saga/persist.ts
    // app.on("window-all-closed", async () => {
    //     // At the moment, there are no menu items to revive / re-open windows,
    //     // so let's terminate the app on MacOS too.
    //     // if (process.platform !== "darwin") {
    //     //     app.quit();
    //     // }

    //     setTimeout(() => app.exit(0), 2000);
    // });

    yield call(() => app.whenReady());

    debug("Main app ready");

    // register file protocol to link locale file to renderer
    protocol.registerFileProtocol("store",
        (request, callback) => {

            // Extract publication item relative url
            const relativeUrl = request.url.substr(6);
            const pubStorage = diMainGet("publication-storage");
            const filePath: string = path.join(pubStorage.getRootPath(), relativeUrl);
            callback(filePath);
        },
    );

    app.on("will-quit", () => {

        debug("#####");
        debug("will-quit");
        debug("#####");
    });

    // const sessionPDFWebview = session.fromPartition("persist:pdfjsreader");
    // const protocolFromPDFWebview = sessionPDFWebview.protocol;
    protocol.registerFileProtocol("pdfjs", async (request, callback) => {

        const url = (new URL(request.url)).pathname;
        debug("PDFJS request this file:", url);

        const pdfjsFolder = "assets/lib/pdfjs";
        let folderPath: string = path.join(__dirname, pdfjsFolder);
        if (_PACKAGING === "0") {
            folderPath = path.join(process.cwd(), "dist", pdfjsFolder);
        }
        const pathname = path.normalize(`${folderPath}/${url}`);

        callback(pathname);
    });

    protocol.registerFileProtocol("pdfjs-extract", async (request, callback) => {

        debug("register file protocol pdfjs-extract");
        debug("request", request);
        const p = request.url.split("pdfjs-extract://")[1];
        debug(p);

        callback(p);
    });


    // init global request protocol hook
    // used in opds auth and import a publication with a form window
    initRequestCustomProtocolEventChannel();

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
                        yield call(needToPersistState);
                        debug("Success to persistState");
                    } catch (e) {
                        debug("ERROR to persistState", e);
                    }

                    try {
                        // clean the db just before to quit
                        yield call(compactDb);
                        debug("Success to compactDb");
                    } catch (e) {
                        debug("ERROR to compactDb", e);
                    }
                }),
                call(function*() {

                    yield put(streamerActions.stopRequest.build());

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
            delay(30000), // 30 seconds timeout to force quit
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
        let shouldExit = process.platform !== "darwin" || IS_DEV;

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
                if (libraryWin.isDestroyed()) {
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

            libraryWin.close();
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
