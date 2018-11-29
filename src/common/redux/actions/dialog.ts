import { DialogType } from "readium-desktop/common/models/dialog";

export enum ActionType {
    OpenRequest = "DIALOG_OPEN_REQUEST",
    CloseRequest = "DIALOG_CLOSE_REQUEST",
}

export function open(type: DialogType, data: any) {
    return {
        type: ActionType.OpenRequest,
        payload: { type, data },
    };
}

export function close() {
    return {
        type: ActionType.CloseRequest,
    };
}
