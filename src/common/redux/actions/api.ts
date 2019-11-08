// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";

export enum ActionType {
    Clean = "API_CLEAN",
    Request = "API_REQUEST",
    Error = "API_ERROR",
    Success = "API_SUCCESS",
}

export interface ApiMeta {
    requestId: string;
    moduleId: TModuleApi;
    methodId: TMethodApi;
}

export interface ApiActionMeta {
    api: ApiMeta;
}

export interface ApiAction extends Action<string, any, ApiActionMeta> {
    meta: ApiActionMeta;
}

export function clean(
    apiRequestId: string,
): Action<string, any> {
    return {
        type: ActionType.Clean,
        payload: {
            requestId: apiRequestId,
        },
    };
}

export function buildSuccessAction(
    requestAction: ApiAction,
    payload: any,
): ApiAction {
    return {
        type: ActionType.Success,
        payload,
        meta: {
            api: {
                requestId: requestAction.meta.api.requestId,
                moduleId: requestAction.meta.api.moduleId,
                methodId: requestAction.meta.api.methodId,
            },
        },
    };
}

export function buildErrorAction(
    requestAction: ApiAction,
    payload: any,
): ApiAction {
    return {
        type: ActionType.Error,
        payload,
        meta: {
            api: {
                requestId: requestAction.meta.api.requestId,
                moduleId: requestAction.meta.api.moduleId,
                methodId: requestAction.meta.api.methodId,
            },
        },
        error: true,
    };
}

/**
 * Build api request action
 * @param apiName name of api
 */
export function buildRequestAction(
    apiRequestId: string,
    apiModuleId: TModuleApi,
    apiMethodId: TMethodApi,
    payload?: any,
): ApiAction {
    return {
        type: ActionType.Request,
        payload,
        meta: {
            api: {
                requestId: apiRequestId,
                moduleId: apiModuleId,
                methodId: apiMethodId,
            },
        },
    };
}
