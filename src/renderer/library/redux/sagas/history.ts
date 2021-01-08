// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { push } from "connected-react-router";
import { historyActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { routerActions, winActions } from "readium-desktop/renderer/library/redux/actions";
import { all, put } from "redux-saga/effects";
import { ILibraryRootState } from "../states";

function* historyWatcher(action: routerActions.locationChanged.TAction) {
    yield put(winActions.history.build(action.payload.location));
}

function* historyRefresh() {
    const location = yield* selectTyped((state: ILibraryRootState) => state?.router?.location);
    if (location) {

        yield put(push(location));
    }
}

export function saga() {
    return all(
        [
            takeSpawnEvery(
                routerActions.locationChanged.ID,
                historyWatcher,
            ),
            takeSpawnEvery(
                historyActions.refresh.ID,
                historyRefresh,
            ),
        ],
    );
}
