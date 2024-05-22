// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { sessionActions } from "../actions";
import { ISessionState } from "../states/session";

const initialState: ISessionState = {
    state: false,
    save: false,
};

function sessionReducer_(
    state = initialState,
    action: sessionActions.enable.TAction | sessionActions.save.TAction,
): ISessionState {
    switch (action.type) {
        case sessionActions.enable.ID:
            return {
                state: action.payload.value,
                save: state.save,
            };
        case sessionActions.save.ID:
            return {
                state: state.state,
                save: action.payload.value,
            };
        default:
            return state;
    }
}

export const sessionReducer = sessionReducer_ as Reducer<ReturnType<typeof sessionReducer_>>;
