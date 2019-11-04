// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CodeError } from "readium-desktop/common/errors";
import { Action } from "readium-desktop/common/models/redux";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";

export enum ActionType {
    Clean = "API_CLEAN",
    Request = "API_REQUEST",
    Result = "API_RESULT",
}

export interface ApiMeta {
    requestId: string;
    moduleId: TModuleApi;
    methodId: TMethodApi;
}

export interface ApiActionMeta {
    api: ApiMeta;
}

export interface ApiAction extends Action {
    meta: ApiActionMeta;
}

export function clean(
    apiRequestId: string,
): Action {
    return {
        type: ActionType.Clean,
        payload: {
            requestId: apiRequestId,
        },
    };
}

export function buildResultAction(
    requestAction: ApiAction,
    payload: any,
): ApiAction {
    const ret: ApiAction = {
        type: ActionType.Result,
        payload,
        meta: {
            api: {
                requestId: requestAction.meta.api.requestId,
                moduleId: requestAction.meta.api.moduleId,
                methodId: requestAction.meta.api.methodId,
            },
        },
    };
    if (payload instanceof CodeError) {
        ret.error = true;
    }
    return ret;
}

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
