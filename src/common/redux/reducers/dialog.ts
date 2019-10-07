// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ActionType } from "readium-desktop/common/redux/actions/dialog";
import { DialogState, IDialogStateData } from "readium-desktop/common/redux/states/dialog";

const initialState: DialogState = {
    open: false,
    type: undefined,
    data: undefined,
};

// The dialog reducer.
export function dialogReducer(
    state: DialogState = initialState,
    action: Action<IDialogStateData>,
) {
    switch (action.type) {
        case ActionType.OpenRequest:
            return Object.assign(
                {},
                state,
                {
                    open: true,
                    type: action.payload.type,
                    data: action.payload.data,
                },
            );
        case ActionType.CloseRequest:
            return Object.assign(
                {},
                initialState,
            );
        default:
            return state;
    }
}
