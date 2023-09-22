// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { TApiMethod, TApiMethodName } from "readium-desktop/common/api/api.type";
import { TMethodApi } from "readium-desktop/common/api/methodApi.type";
import { TModuleApi } from "readium-desktop/common/api/moduleApi.type";
import { apiActions } from "readium-desktop/common/redux/actions";
import { ApiResponse, LAST_API_SUCCESS_ID } from "readium-desktop/common/redux/states/api";
import { TReturnPromiseOrGeneratorType } from "readium-desktop/typings/api";
import { Dispatch } from "redux";
import { v4 as uuidv4 } from "uuid";

import { IRendererCommonRootState } from "../../../../common/redux/states/rendererCommonRootState";

export function apiDispatch(dispatch: Dispatch) {
    return (requestId: string = uuidv4()) =>
        <T extends TApiMethodName>(apiPath: T) => {
            const splitPath = apiPath.split("/");
            const moduleId = splitPath[0] as TModuleApi;
            const methodId = splitPath[1] as TMethodApi;

            return (...requestData: Parameters<TApiMethod[T]>) =>
                dispatch(apiActions.request.build(requestId, moduleId, methodId, requestData));
        };
}

export function apiState(state: IRendererCommonRootState) {
    return (requestId: string) =>
        <T extends TApiMethodName>(_apiPath: T): ApiResponse<TReturnPromiseOrGeneratorType<TApiMethod[T]>> =>
            state.api[requestId];
}

export function apiRefreshToState(state: IRendererCommonRootState) {
    return (apiPathArray: TApiMethodName[]): boolean =>
        state.api[LAST_API_SUCCESS_ID]?.data.moduleId &&
        apiPathArray.includes(
            // tslint:disable-next-line: max-line-length
            `${state.api[LAST_API_SUCCESS_ID].data.moduleId}/${state.api[LAST_API_SUCCESS_ID].data.methodId}` as TApiMethodName);
}

export function apiClean(dispatch: Dispatch) {
    return (requestId: string) => dispatch(apiActions.clean.build(requestId));
}
