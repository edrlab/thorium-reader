// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogType } from "readium-desktop/common/models/dialog";
import { IDialogStateData } from "readium-desktop/common/redux/states/dialog";

export enum ActionType {
    OpenRequest = "DIALOG_OPEN_REQUEST",
    CloseRequest = "DIALOG_CLOSE_REQUEST",
}

export function open<T extends keyof DialogType>(type: T, data: DialogType[T]) {
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
