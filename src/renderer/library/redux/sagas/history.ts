// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { push } from "connected-react-router";
import { historyActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { routerActions, winActions } from "readium-desktop/renderer/library/redux/actions";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";
import { buildOpdsBrowserRoute } from "../../opds/route";

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

function* historyPush(action: historyActions.pushFeed.TAction) {

    const location = yield* selectTyped((state: ILibraryRootState) => state?.router?.location);
    if (location) {

        const feed = action.payload.feed;

        const newLocation = {
            ...location,
            pathname: buildOpdsBrowserRoute(
                feed.identifier,
                feed.title,
                feed.url,
            ),
        };

        yield put(push(newLocation));
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
            takeSpawnEvery(
                historyActions.pushFeed.ID,
                historyPush,
            ),
        ],
    );
}
