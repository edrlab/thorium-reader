// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, protocol } from "electron";
import * as path from "path";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import { call } from "redux-saga/effects";

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

    app.on("accessibility-support-changed", (_ev, accessibilitySupportEnabled) => {
        debug(`accessibilitySupportEnabled: ${accessibilitySupportEnabled}`);
    });

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

    // track command-q or ctrl-q
    app.on("before-quit", (e) => {

        e.preventDefault();

        const libraryWin = getLibraryWindowFromDi();
        libraryWin.close();
    });
}
