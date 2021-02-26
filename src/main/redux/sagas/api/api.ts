// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { CodeError } from "readium-desktop/common/codeError.class";
import { apiActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { diMainGet } from "readium-desktop/main/di";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { error } from "readium-desktop/main/error";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, cancelled, put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";

// Logger
const filename_ = "readium-desktop:main:saga:api";
const debug = debug_(filename_);

const getSymbolName = (apiName: string) => {
    const keys = ObjectKeys(diSymbolTable);
    const entry = keys.find((symbolName) => symbolName === `${apiName}-api`);
    if (entry) {
        return entry;
    }
    throw new Error("Wrong API name called " + apiName);
};

function* processRequest(requestAction: apiActions.request.TAction): SagaGenerator<void> {
    const { api } = requestAction.meta;

    try {
        debug(api.moduleId, api.methodId, requestAction.payload);

        const apiModule = yield call(() => diMainGet(getSymbolName(api.moduleId)));

        const result = yield call(
            () => (apiModule as any)[api.methodId](...(requestAction.payload || [])),
        );

        yield put(apiActions.result.build(api, result));
    } catch (error) {
        debug("API-ERROR", error, "requestAction: ", requestAction);
        yield put(apiActions.result.build(api, new CodeError("API-ERROR", error.message)));
    } finally {
        if (yield cancelled()) {
            debug("API-CANCELLED", requestAction);

            yield put(apiActions.result.build(api, new CodeError("API-CANCELLED")));
        }
    }
}

export function saga() {

    return takeSpawnEvery(
        apiActions.request.ID,
        processRequest,
        (e) => error(filename_, e),
    );
}
