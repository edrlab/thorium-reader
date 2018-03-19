import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    InitRequest = "APP_INIT_REQUEST",
    InitError = "APP_INIT_ERROR",
    InitSuccess = "APP_INIT_SUCCESS",
}

export function appInit(): Action {
    return {
        type: ActionType.InitRequest,
    };
}
