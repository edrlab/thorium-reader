// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";
import { i18nActions } from "readium-desktop/common/redux/actions/";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { diLibraryGet } from "readium-desktop/renderer/library/di";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

function* winInitWatcher(): SagaIterator {
    yield all({
        win: take(winActions.initRequest.ID),
        i18n: take(i18nActions.setLocale.ID),
    });

    yield put(winActions.initSuccess.build());
}

function* winStartWatcher(): SagaIterator {

    yield take(winActions.initSuccess.ID);

    // starting point to mounting React to the DOM
    ReactDOM.render(
        React.createElement(
            diLibraryGet("react-main-app"),
            null),
        document.getElementById("app"),
    );
}

export function* watchers() {
    yield all([
        call(winInitWatcher),
        call(winStartWatcher),
    ]);
}
