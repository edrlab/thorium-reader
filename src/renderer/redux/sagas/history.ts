// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { routerActions, winActions } from "readium-desktop/renderer/redux/actions/";
import { all, call, put } from "redux-saga/effects";

function* historyWatcher() {
    while (true) {
        const action = yield* takeTyped(routerActions.locationChanged.build);
        yield put(winActions.history.build(action.payload.location));
    }
}

export function* watchers() {
    yield all([
        call(historyWatcher),
    ]);
}
