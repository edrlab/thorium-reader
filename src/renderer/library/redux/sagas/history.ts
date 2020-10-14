// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { routerActions, winActions } from "readium-desktop/renderer/library/redux/actions";
import { put } from "redux-saga/effects";

function* historyWatcher(action: routerActions.locationChanged.TAction) {
    yield put(winActions.history.build(action.payload.location));
}

export function saga() {
    return takeSpawnEvery(
        routerActions.locationChanged.ID,
        historyWatcher,
    );
}
