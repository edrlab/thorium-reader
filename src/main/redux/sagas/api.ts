// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { CodeError } from "readium-desktop/common/errors";
import { apiActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { diMainGet } from "readium-desktop/main/di";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { SagaIterator } from "redux-saga";
import { all, call, fork, put } from "redux-saga/effects";

// Logger
const debug = debug_("readium-desktop:main#redux/sagas/api");

const getSymbolName = (apiName: string) => {
    const entry = Object.keys(diSymbolTable)
        .find((symbolName) => symbolName === `${apiName}-api`) as keyof typeof diSymbolTable;
    if (entry) {
        return entry;
    }
    throw new Error("Wrong API name called " + apiName);
};

export function* processRequest(requestAction: apiActions.request.TAction): SagaIterator {
    const { api } = requestAction.meta;

    try {
        const apiModule = diMainGet(getSymbolName(api.moduleId));
        const apiMethod = apiModule[api.methodId].bind(apiModule);

        debug(api.moduleId, api.methodId, requestAction.payload);

        const result = yield call(
            apiMethod,
            ...(requestAction.payload || []),
        );

        yield put(apiActions.result.build(api, result));
    } catch (error) {
        debug(error);
        yield put(apiActions.result.build(api, new CodeError("API-ERROR", error.message)));
    }
}

export function* requestWatcher() {
    while (true) {
        const action = yield* takeTyped(apiActions.request.build);
        yield fork(processRequest, action);
    }
}

export function* watchers() {
    yield all([
        call(requestWatcher),
    ]);
}
