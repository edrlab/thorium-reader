// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { opdsActions } from "readium-desktop/common/redux/actions";
import { OpdsState } from "readium-desktop/common/redux/states/opds";

const initialState: OpdsState = {
    items: [],
};

export function opdsReducer(
    state: OpdsState = initialState,
    action: Action,
    ): OpdsState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case opdsActions.ActionType.SetSuccess:
            newState.items = action.payload.items;
            return newState;
        case opdsActions.ActionType.AddSuccess:
            newState.items.push(action.payload.item);
            return newState;
        case opdsActions.ActionType.UpdateSuccess:
            newState.items = [];

            for (const opds of state.items) {
                if (opds.identifier === action.payload.item.identifier) {
                    // Push the new opds
                    newState.items.push(action.payload.item);
                } else {
                    newState.items.push(opds);
                }
            }
            return newState;
        case opdsActions.ActionType.RemoveSuccess:
            newState.items = [];

            for (const opds of state.items) {
                if (opds.identifier === action.payload.item.identifier) {
                    // Remove the given opds
                    continue;
                }

                newState.items.push(opds);
            }
            return newState;
        default:
            return state;
    }
}
