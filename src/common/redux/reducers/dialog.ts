// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DialogTypeName } from "readium-desktop/common/models/dialog";
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
        dialogActions.closeRequest.TAction |
        dialogActions.updateRequest.TAction,
): DialogState {
    let data = {};

    switch (action.type) {
        case dialogActions.openRequest.ID: {
            switch (action.payload.type) {
                // handle in redux-saga by subscribers
                case DialogTypeName.PublicationInfoOpds:
                case DialogTypeName.PublicationInfoReader:
                case DialogTypeName.PublicationInfoLib:
                case DialogTypeName.ToastModal:
                    break;
                default:
                    data = action.payload.data;
            }
            return {
                ...state,
                ...{
                    open: true,
                    type: action.payload.type,
                    data,
                },
            };
        }

        case dialogActions.updateRequest.ID:
            return {
                ...state,
                ...{
                    data: {
                        ...state.data,
                        ...action.payload.data,
                    },
                },
            };

        case dialogActions.closeRequest.ID:
            return {
                ...initialState,
            };

        default:
            break;
    }

    return state;
}
