import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    Info = "LOGGER_INFO",
}

export function info(message: string): Action {
    return {
        type: ActionType.Info,
        payload: {
            message,
        },
    };
}
