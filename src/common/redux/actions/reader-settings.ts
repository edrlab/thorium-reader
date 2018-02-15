import { Reader } from "readium-desktop/common/models/reader";
import { Settings } from "readium-desktop/common/models/settings";

import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    SaveRequest = "READER_SETTINGS_SAVE_REQUEST",
    SaveSuccess = "READER_SETTINGS_SAVE_SUCCESS",
    SaveError = "READER_SETTINGS_SAVE_ERROR",

    RestoreRequest = "READER_SETTINGS_RESTORE_REQUEST",
    RestoreSuccess = "READER_SETTINGS_RESTORE_SUCCESS",
    RestoreError = "READER_SETTINGS_RESTORE_ERROR",
}

export function save(settings: Settings): Action {
    return {
        type: ActionType.SaveRequest,
        payload: {
            settings,
        },
    };
}

export function restore(): Action {
    return {
        type: ActionType.RestoreRequest,
    };
}
