// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { type TScreenViewAnalyticsScreenName } from "readium-desktop/common/analytics/screen";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { logEvent } from "readium-desktop/renderer/common/analytics";
import { buildLibraryScreenViewAnalyticsEvent } from "readium-desktop/renderer/library/analytics";
import { routerActions } from "readium-desktop/renderer/library/redux/actions";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";

const debug = debug_("readium-desktop:renderer:redux:saga:analytics");

let lastScreenViewAnalyticsScreenName: TScreenViewAnalyticsScreenName | undefined;

function* logScreenView(pathname: string | undefined) {

    const analyticsEvent = buildLibraryScreenViewAnalyticsEvent(pathname);
    if (!analyticsEvent || analyticsEvent.screenName === lastScreenViewAnalyticsScreenName) {
        return;
    }

    lastScreenViewAnalyticsScreenName = analyticsEvent.screenName;
    yield call(logEvent, analyticsEvent.name, analyticsEvent.params);
}

function* screenViewWatcher(action: routerActions.locationChanged.TAction) {
    yield* logScreenView(action.payload.location.pathname);
}

function* initialScreenView() {
    const location = yield* selectTyped((state: ILibraryRootState) => state.router.location);
    yield* logScreenView(location?.pathname);
}

export function saga() {
    return all([
        call(initialScreenView),
        takeSpawnEvery(
            routerActions.locationChanged.ID,
            screenViewWatcher,
            (e) => debug(e),
        ),
    ]);
}
