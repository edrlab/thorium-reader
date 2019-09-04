// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { container } from "readium-desktop/main/di";

import * as debug_ from "debug";

import { SagaIterator } from "redux-saga";

import { all, call, fork, put, take } from "redux-saga/effects";

import { apiActions } from "readium-desktop/common/redux/actions";

// Logger
const debug = debug_("readium-desktop:main#redux/sagas/api");

export function* processRequest(requestAction: apiActions.ApiAction): SagaIterator {
    const { api } = requestAction.meta;
    const apiModule: any = container
        .get(`${api.moduleId}-api`);
    const apiMethod = apiModule[api.methodId].bind(apiModule);

    debug(api.moduleId, api.methodId, requestAction.payload);

    try {
        const result = yield call(
            apiMethod,
            ...requestAction.payload,
        );

        yield put(apiActions.buildSuccessAction(requestAction, result));
    } catch (error) {
        debug(error);
        yield put(apiActions.buildErrorAction(requestAction, error.message));
    }
}

export function* requestWatcher() {
    while (true) {
        const action: apiActions.ApiAction = yield take(apiActions.ActionType.Request);
        yield fork(processRequest, action);
    }
}

export function* watchers() {
    yield all([
        call(requestWatcher),
    ]);
}
