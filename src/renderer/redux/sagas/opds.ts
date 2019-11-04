// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LOCATION_CHANGE } from "connected-react-router";
import { apiActions } from "readium-desktop/common/redux/actions";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

export const BROWSE_OPDS_API_REQUEST_ID = "browseOpdsApiResult";

// https://reacttraining.com/react-router/web/api/withRouter
// tslint:disable-next-line: max-line-length
// withRouter does not subscribe to location changes like React Redux’s connect does for state changes. Instead, re-renders after location changes propagate out from the <Router> component. This means that withRouter does not re-render on route transitions unless its parent component re-renders.
export function* browseWatcher(): SagaIterator {
    while (true) {
        const result = yield take(LOCATION_CHANGE);
        const path = result.payload.location.pathname as string;

        if (path.startsWith("/opds") && path.indexOf("/browse") > 0 ) {
            const parsedResult = parseOpdsBrowserRoute(path);
            const { level, title, url } = parsedResult;
            yield put(opdsActions.browse(level, title, url));
            // dispatch api browse with fixed const requestId
            // The api result can be found by specific requestId in each componnent
        }
    }
}

export function* browseRequestWatcher(): SagaIterator {
    while (true) {
        const action: opdsActions.IActionBrowseRequest =
            yield take(opdsActions.ActionType.BrowseRequest);
        yield put(apiActions.)
    }
}

export function* watchers() {
    yield all([
        call(browseWatcher),
    ]);
}
