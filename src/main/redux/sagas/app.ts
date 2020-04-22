// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, protocol } from "electron";
import * as path from "path";
import { error } from "readium-desktop/common/error";
import { keyboardActions } from "readium-desktop/common/redux/actions";
import { diMainGet } from "readium-desktop/main/di";
import { keyboardShortcuts } from "readium-desktop/main/keyboard";
import { appActions, winActions } from "readium-desktop/main/redux/actions";
import { all, call, put, take } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:saga:app";
const debug = debug_(filename_);

function* mainApp() {

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

}

function* appInitWatcher() {
    yield take(appActions.initRequest.ID);

    yield call(mainApp);

    yield call(keyboardShortcuts.init);

    yield put(appActions.initSuccess.build());

    yield put(keyboardActions.setShortcuts.build(keyboardShortcuts.getAll(), false));

    yield put(winActions.library.openRequest.build());
}

export function* watchers() {
    try {

        yield all([
            call(appInitWatcher),
        ]);

    } catch (err) {
        error(filename_, err);
    }
}
