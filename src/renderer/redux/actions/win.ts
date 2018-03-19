import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    InitRequest = "WIN_INIT_REQUEST",
    InitError = "WIN_INIT_ERROR",
    InitSuccess = "WIN_INIT_SUCCESS",
}

export function winInit(winId: string): Action {
    return {
        type: ActionType.InitRequest,
        payload: {
            winId,
        },
    };
}
