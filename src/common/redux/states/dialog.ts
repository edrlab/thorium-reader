import { DialogType } from "readium-desktop/common/models/dialog";

export interface DialogState {
    open: boolean;
    type: DialogType;
    data: any;
}
