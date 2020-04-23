// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app as appElectron, dialog } from "electron";
import { error } from "readium-desktop/common/error";
import { keyboardActions } from "readium-desktop/common/redux/actions";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { keyboardShortcuts } from "readium-desktop/main/keyboard";
import { all, call, put, take } from "redux-saga/effects";

import { appActions, winActions } from "../actions";
import * as api from "./api";
import * as app from "./app";
import * as i18n from "./i18n";
import * as ipc from "./ipc";
import * as keyboard from "./keyboard";
import * as persist from "./persist";
import * as reader from "./reader";
import * as streamer from "./streamer";
import * as win from "./win";

// import { netStatusWatcher } from "./net";
// import { updateStatusWatcher } from "./update";

// Logger
const filename_ = "readium-desktop:main:saga:app";
const debug = debug_(filename_);

export function* rootSaga() {

    // main entry
    yield take(appActions.initRequest.ID);

    yield i18n.spawn();

    try {
        yield all([
            call(app.init),
            call(keyboardShortcuts.init),
        ]);

    } catch (e) {
        const code = 1;
        try {
            dialog.showErrorBox("Application init Error", `main rootSaga: ${e}\n\nEXIT CODE ${code}`);
        } catch {
            // ignore
        }

        debug("CRITICAL ERROR => EXIT");
        debug(e);
        appElectron.exit(code);
    }

    // send initSucess first
    yield put(appActions.initSuccess.build());

    // yield spawnLeading(i18n.watchers, (e) => error("main:rootSaga:i18n", e));

    yield api.spawn();
    // yield spawnLeading(api.watchers, (e) => error("main:rootSaga:api", e));
    yield spawnLeading(streamer.watchers, (e) => error("main:rootSaga:streamer", e));
    yield spawnLeading(keyboard.watchers, (e) => error("main:rootSaga:keyboard", e));
    yield spawnLeading(win.reader.watchers, (e) => error("main:rootSaga:win:reader", e));
    yield spawnLeading(win.library.watchers, (e) => error("main:rootSaga:win:library", e));
    yield spawnLeading(win.session.library.watchers, (e) => error("main:rootSaga:win:session:library", e));
    yield spawnLeading(win.session.reader.watchers, (e) => error("main:rootSaga:win:session:reader", e));
    yield spawnLeading(ipc.watchers, (e) => error("main:rootSaga:ipc", e));
    yield spawnLeading(reader.watchers, (e) => error("main:rootSaga:reader", e));
    yield spawnLeading(persist.watchers, (e) => error("main:rootSaga:persist", e));

    // dispatch at the end
    yield put(keyboardActions.setShortcuts.build(keyboardShortcuts.getAll(), false));

    yield put(winActions.library.openRequest.build());
}
