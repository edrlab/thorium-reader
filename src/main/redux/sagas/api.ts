// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { container } from "readium-desktop/main/di";

import * as moment from "moment";

import { SagaIterator } from "redux-saga";

import { call, fork, put, select, take } from "redux-saga/effects";

import { apiActions } from "readium-desktop/common/redux/actions";

export function* processRequest(requestAction: apiActions.ApiAction): SagaIterator {
    const { api } = requestAction.meta;
    console.log("####", requestAction);
    const apiModule: any = container
        .get(`${api.moduleId}-api`);
    const apiMethod = apiModule[api.methodId].bind(apiModule);

    try {
        const result = yield call(
            apiMethod,
            requestAction.payload,
        );

        yield put(apiActions.buildSuccessAction(requestAction, result));
    } catch (error) {
        yield put(apiActions.buildErrorAction(requestAction, error.message));
    }
}

export function* requestWatcher() {
    while (true) {
        const action = yield take(apiActions.ActionType.Request);
        yield fork(processRequest, action);
    }
}

export function* watchers() {
    yield [
        requestWatcher(),
    ];
}
