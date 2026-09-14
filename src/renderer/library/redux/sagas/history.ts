// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { goBack, push } from "redux-first-history";
import { Location } from "history";
import { authActions, historyActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { logEvent } from "readium-desktop/renderer/common/analytics";
import {
    buildLibraryPageViewParams,
    libraryPageTitleFromPathname,
    TLibraryPageTitle,
} from "readium-desktop/renderer/library/analytics/pageView";
import { routerActions, winActions } from "readium-desktop/renderer/library/redux/actions";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";
import { buildOpdsBrowserRoute } from "../../opds/route";

import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

let lastPageViewTitle: TLibraryPageTitle | undefined;

function* sendPageView(location: Location) {
    const pageTitle = libraryPageTitleFromPathname(location.pathname);

    if (!pageTitle) {
        lastPageViewTitle = undefined;
        return;
    }

    if (pageTitle === lastPageViewTitle) {
        return;
    }

    lastPageViewTitle = pageTitle;
    yield call(logEvent, "page_view", buildLibraryPageViewParams(pageTitle));
}

function* sendInitialPageView() {
    const location = yield* selectTyped((state: ILibraryRootState) => state?.router?.location);
    if (location) {
        yield* sendPageView(location);
    }
}

function* historyWatcher(action: routerActions.locationChanged.TAction) {
    yield* sendPageView(action.payload.location);
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

function* historyGoBack() {
    yield put(goBack());
}

export function saga() {
    return all(
        [
            call(sendInitialPageView),
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
            takeSpawnEvery(
                authActions.cancel.ID,
                historyGoBack,
            ),
        ],
    );
}
