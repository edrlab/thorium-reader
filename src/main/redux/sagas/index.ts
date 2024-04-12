// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app, dialog } from "electron";
import { keyboardActions } from "readium-desktop/common/redux/actions";
import { keyboardShortcuts } from "readium-desktop/main/keyboard";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put, take } from "redux-saga/effects";

import { appActions, winActions } from "../actions";
import * as api from "./api";
import * as appSaga from "./app";
import * as auth from "./auth";
import * as events from "./event";
import * as i18n from "./i18n";
import * as ipc from "./ipc";
import * as keyboard from "./keyboard";
import * as persist from "./persist";
import * as reader from "./reader";
import * as streamer from "./streamer";
import * as win from "./win";
// import * as telemetry from "./telemetry";
import * as lcp from "./lcp";
import * as catalog from "./catalog";

// Logger
const filename_ = "readium-desktop:main:saga:app";
const debug = debug_(filename_);

export function* rootSaga() {

    // main entry point
    yield take(appActions.initRequest.ID);

    yield i18n.saga();
    // yield spawnLeading(i18n.watchers, (e) => error("main:rootSaga:i18n", e));

    try {
        yield all([
            call(appSaga.init),
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

        app.exit(code);
    }

    // watch all electon exit event
    yield appSaga.exit();

    yield api.saga();
    // yield spawnLeading(api.watchers, (e) => error("main:rootSaga:api", e));

    yield streamer.saga();
    // yield spawnLeading(streamer.watchers, (e) => error("main:rootSaga:streamer", e));

    yield keyboard.saga();
    // yield spawnLeading(keyboard.watchers, (e) => error("main:rootSaga:keyboard", e));

    yield win.reader.saga();
    // yield spawnLeading(win.reader.watchers, (e) => error("main:rootSaga:win:reader", e));

    yield win.library.saga();
    // yield spawnLeading(win.library.watchers, (e) => error("main:rootSaga:win:library", e));

    yield win.session.reader.saga();
    // yield spawnLeading(win.session.library.watchers, (e) => error("main:rootSaga:win:session:library", e));

    yield win.session.library.saga();
    // yield spawnLeading(win.session.reader.watchers, (e) => error("main:rootSaga:win:session:reader", e));

    yield ipc.saga();
    // yield spawnLeading(ipc.watchers, (e) => error("main:rootSaga:ipc", e));

    yield reader.saga();
    // yield spawnLeading(reader.watchers, (e) => error("main:rootSaga:reader", e));

    // halt entry point
    yield persist.saga();
    // yield spawnLeading(persist.watchers, (e) => error("main:rootSaga:persist", e));

    // OPDS authentication flow
    yield auth.saga();

    // LCP saga
    yield lcp.saga();

    // get/set catalog in library win
    yield catalog.saga();

    // rehydrate shorcuts in redux
    yield put(keyboardActions.setShortcuts.build(keyboardShortcuts.getAll(), false));

    // enjoy the app !
    yield put(winActions.library.openRequest.build());

    // call telemetry before app init state
    // need to track the previous state version before update in initSuccess.build
    //yield call(telemetry.collectSaveAndSend);

    // app initialized
    yield put(appActions.initSuccess.build());

    // wait library window fully opened before to throw events
    yield take(winActions.library.openSucess.build);

    // open reader from CLI or open-file event on MACOS
    yield events.saga();
}
