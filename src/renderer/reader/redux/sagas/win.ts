// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { diReaderGet } from "readium-desktop/renderer/reader/di";
import { SagaIterator } from "redux-saga";
import { all, call, fork, put, take } from "redux-saga/effects";

function* winInitWatcher(): SagaIterator {

    yield fork(function*() {
        while (true) {

            yield take(winActions.initRequest.ID);

            yield put(winActions.initSuccess.build());

            // starting point to mounting React to the DOM
            ReactDOM.render(
                React.createElement(
                    diReaderGet("react-reader-app"),
                    null),
                document.getElementById("app"),
            );
        }
    });
}

export function* watchers() {
    yield all([
        call(winInitWatcher),
    ]);
}
