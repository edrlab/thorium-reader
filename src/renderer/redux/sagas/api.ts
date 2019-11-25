// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { apiActions } from "readium-desktop/common/redux/actions";
import { TApiMethod, TApiMethodName } from "readium-desktop/main/api/api.type";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";
import { put } from "redux-saga/effects";

/**
 *
 * api function to dispatch an api request in redux-saga.
 * should be call with yield* to delegate to another generator
 *
 * @param apiPath name of the api
 * @param requestId id string channel
 * @param requestData typed api parameter
 */
export function* apiSaga<T extends TApiMethodName>(
    apiPath: T,
    requestId: string,
    ...requestData: Parameters<TApiMethod[T]>
) {
    const splitPath = apiPath.split("/");
    const moduleId = splitPath[0] as TModuleApi;
    const methodId = splitPath[1] as TMethodApi;
    yield put(apiActions.request.build(requestId, moduleId, methodId, requestData));
}
