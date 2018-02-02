import { Publication } from "readium-desktop/common/models/publication";
import { Reader } from "readium-desktop/common/models/reader";

import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    OpenRequest = "READER_OPEN_REQUEST",
    OpenSuccess = "READER_OPEN_SUCCESS",
    OpenError = "READER_OPEN_ERROR",

    CloseRequest = "READER_CLOSE_REQUEST",
    CloseSuccess = "READER_CLOSE_SUCCESS",
    CloseError = "READER_CLOSE_ERROR",
}

export function open(publication: Publication): Action {
    return {
        type: ActionType.OpenRequest,
        payload: {
            publication,
        },
    };
}

export function close(reader: Reader): Action {
    return {
        type: ActionType.CloseRequest,
        payload: {
            close,
        },
    };
}
