// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialog } from "electron";
import { watchdogActions } from "readium-desktop/common/redux/actions";
import { raceTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { Translator } from "readium-desktop/common/services/translator";
import { call, delay, put, spawn, take } from "redux-saga/effects";

// https://en.wikipedia.org/wiki/Watchdog_timer
// finaly watchdog doesn't work in renderer process
// when the main process is blocked, all the renderer process are also blocked.
// I thought the renderering processing stayed free but no.
// In this case it cannot launch an errorBox.

function* watchdogMasterSaga() {
    while (true) {
        yield delay(5000);

        yield put(watchdogActions.watchdog.build());
    }
}

function* watchdogSlaveSaga(translator: Translator) {
    while (true) {
        const [ timeout, action ] = yield* raceTyped([
            delay(12000),
            take(watchdogActions.watchdog.ID),
        ]);

        console.log(timeout, action);

        if (timeout) {
            yield call(
                () =>
                    dialog.showErrorBox(
                        translator.translate("error.watchdog.title"),
                        translator.translate("error.watchdog.message"),
                    ),
            );

            take(watchdogActions.watchdog.ID);
        }
    }
}

export function sagaMaster() {
    return spawn(watchdogMasterSaga);
}

export function sagaSlave(translator: Translator) {
    return spawn(watchdogSlaveSaga, translator);
}
