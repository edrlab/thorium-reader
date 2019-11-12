// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialogActions } from "readium-desktop/common/redux/actions/";
import { DialogState } from "readium-desktop/common/redux/states/dialog";

const initialState: DialogState = {
    open: false,
    type: undefined,
    data: undefined,
};

// The dialog reducer.
export function dialogReducer(
    state: DialogState = initialState,
    action: dialogActions.openRequest.TAction |
        dialogActions.closeRequest.TAction,
) {
    switch (action.type) {
        case dialogActions.openRequest.ID:
            return Object.assign(
                {},
                state,
                {
                    open: true,
                    type: action.payload.type,
                    data: action.payload.data,
                },
            );
        case dialogActions.closeRequest.ID:
            return Object.assign(
                {},
                initialState,
            );
        default:
            return state;
    }
}
