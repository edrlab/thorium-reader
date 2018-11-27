import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    Clean = "API_CLEAN",
    Request = "API_REQUEST",
    Error = "API_ERROR",
    Success = "API_SUCCESS",
}

export interface ApiMeta {
    requestId: string;
    module: string;
    methodId: string;
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
                module: requestAction.meta.api.module,
                methodId: requestAction.meta.api.methodId,
            }
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
                module: requestAction.meta.api.module,
                methodId: requestAction.meta.api.methodId,
            }
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
    apiModule: string,
    apiMethodId: string,
    payload?: any,
): ApiAction {
    return {
        type: ActionType.Request,
        payload,
        meta: {
            api: {
                requestId: apiRequestId,
                module: apiModule,
                methodId: apiMethodId,
            },
        },
    };
}
