// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nActions } from "readium-desktop/common/redux/actions/";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { renderMainApp } from "readium-desktop/index_app";
import { renderReaderApp } from "readium-desktop/index_reader";
import { winActions } from "readium-desktop/renderer/redux/actions/";
import { RootState } from "readium-desktop/renderer/redux/states";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

function* winInitWatcher(): SagaIterator {
    while (true) {

        yield all({
            win: take(winActions.initRequest.ID),
            i18n: take(i18nActions.setLocale.ID),
        });

        yield put(winActions.initSuccess.build());
    }
}

let notRendered = true;

function* winStartWatcher(): SagaIterator {

    while (true) {

        yield take(winActions.initSuccess.ID);

        if (notRendered) {

            const isReader = yield* selectTyped(
                (state: RootState) =>
                    typeof state.reader.reader !== "undefined",
            );

            if (isReader) {
                renderReaderApp();
            } else {
                renderMainApp();
            }
            notRendered = false;
        }
    }
}

export function* watchers() {
    yield all([
        call(winInitWatcher),
        call(winStartWatcher),
    ]);
}
