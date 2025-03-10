// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { dockActions } from "readium-desktop/common/redux/actions/";
import { DockState } from "readium-desktop/common/redux/states/dock";

const initialState: DockState = {
    open: false,
    type: undefined,
    data: undefined,
};

// The dock reducer.
function dockReducer_(
    state: DockState = initialState,
    action: dockActions.openRequest.TAction |
        dockActions.closeRequest.TAction |
        dockActions.updateRequest.TAction,
): DockState {

    switch (action.type) {
        case dockActions.openRequest.ID: {
            const data = {
                ...action.payload.data,
            };
            return {
                ...state,
                ...{
                    open: true,
                    type: action.payload.type,
                    data,
                },
            };
        }

        case dockActions.updateRequest.ID:
            return {
                ...state,
                ...{
                    data: {
                        ...state.data,
                        ...action.payload.data,
                    },
                },
            };

        case dockActions.closeRequest.ID:
            return {
                ...initialState,
            };

        default:
            break;
    }

    return state;
}

export const dockReducer = dockReducer_ as Reducer<ReturnType<typeof dockReducer_>>;
