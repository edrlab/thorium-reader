import { ApiDataResponse } from './../states/api';
import { ApiLastSuccess } from 'readium-desktop/renderer/redux/states/api';
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
import { Dispatch, Store } from "redux";
import * as uuid from "uuid";

export function apiDispatch(dispatch: Dispatch) {
    return <T extends TApiMethodName>(apiPath: T, requestId: string = uuid.v4()) => {
      const splitPath = apiPath.split("/");
      const moduleId = splitPath[0] as TModuleApi;
      const methodId = splitPath[1] as TMethodApi;

      return (...requestData: Parameters<TApiMethod[T]>) =>
        dispatch(apiActions.buildRequestAction(requestId, moduleId, methodId, requestData));
    };
}

export function apiState(state: RootState) {
    let lastSuccess: ApiLastSuccess | undefined;
    return <T extends TApiMethodName>(apiPath: T, requestId: string): ApiDataResponse<ReturnType<TApiMethod[T]>> => {
        const splitPath = apiPath.split("/");
        const moduleId = splitPath[0] as TModuleApi;
        const methodId = splitPath[1] as TMethodApi;
        const apiLastSuccess = state.api.lastSuccess;
        const lastSuccessDate = (lastSuccess && lastSuccess.date) || 0;

        if (!apiLastSuccess || apiLastSuccess.date <= lastSuccessDate) {
            return undefined;
        }

        // New api success
        lastSuccess = apiLastSuccess;

        const meta = apiLastSuccess.action.meta.api;
        if (moduleId === meta.moduleId && methodId === meta.methodId && state.api.data[requestId]) {
            const request = Object.assign({}, state.api.data[requestId]);
            return request;
        }
        return undefined;
    };
}
