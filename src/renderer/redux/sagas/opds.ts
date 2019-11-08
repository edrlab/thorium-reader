// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LOCATION_CHANGE } from "connected-react-router";
import { Action } from "readium-desktop/common/models/redux";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

export function* browseWatcher(): SagaIterator {
    while (true) {
        const result: Action<string, { location: URL }> = yield take(LOCATION_CHANGE);
        const path = result.payload.location.pathname as string;

        if (path.startsWith("/opds") && path.indexOf("/browse") > 0 ) {
            const parsedResult = parseOpdsBrowserRoute(path);
            const { level, title, url } = parsedResult;
            yield put(opdsActions.browseRequest.build(level, title, url));
        }
    }
}

export function* watchers() {
    yield all([
        call(browseWatcher),
    ]);
}
