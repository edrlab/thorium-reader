// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LOCATION_CHANGE, LocationChangeAction } from "connected-react-router";
import { winActions } from "readium-desktop/renderer/redux/actions/";
import { TLocationRouter } from "readium-desktop/renderer/routing";
import { all, call, put, take } from "redux-saga/effects";

function* historyWatcher() {
    while (true) {
        const result: LocationChangeAction = yield take(LOCATION_CHANGE);
        yield put(winActions.history.build(result.payload.location as TLocationRouter));
    }
}

export function* watchers() {
    yield all([
        call(historyWatcher),
    ]);
}
