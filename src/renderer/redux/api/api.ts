// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { apiActions } from "readium-desktop/common/redux/actions";
import { TApiMethod, TApiMethodName } from "readium-desktop/main/api/api.type";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/renderer/redux/states";
import { ApiResponse, LAST_API_SUCCESS_ID } from "readium-desktop/renderer/redux/states/api";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { Dispatch } from "redux";
import * as uuid from "uuid";

export function apiDispatch(dispatch: Dispatch) {
    return (requestId: string = uuid.v4()) =>
        <T extends TApiMethodName>(apiPath: T) => {
            const splitPath = apiPath.split("/");
            const moduleId = splitPath[0] as TModuleApi;
            const methodId = splitPath[1] as TMethodApi;

            return (...requestData: Parameters<TApiMethod[T]>) =>
                dispatch(apiActions.request.build(requestId, moduleId, methodId, requestData));
        };
}

export function apiState(state: RootState) {
    return (requestId: string) =>
        <T extends TApiMethodName>(_apiPath: T): ApiResponse<ReturnPromiseType<TApiMethod[T]>> =>
            state.api[requestId];
}

export function apiRefreshToState(state: RootState) {
    return (apiPathArray: TApiMethodName[]): boolean =>
        state.api[LAST_API_SUCCESS_ID]?.data.moduleId &&
        apiPathArray.includes(
            // tslint:disable-next-line: max-line-length
            `${state.api[LAST_API_SUCCESS_ID].data.moduleId}/${state.api[LAST_API_SUCCESS_ID].data.methodId}` as TApiMethodName);
}

export function apiClean(dispatch: Dispatch) {
    return (requestId: string) => dispatch(apiActions.clean.build(requestId));
}
