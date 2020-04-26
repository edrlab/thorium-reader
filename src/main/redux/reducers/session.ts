// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { sessionActions } from "../actions";
import { ISessionState } from "../states/session";

const initialState: ISessionState = {
    state: false,
};

export function sessionReducer(
    state = initialState,
    action: sessionActions.enable.TAction,
): ISessionState {
    switch (action.type) {
        case sessionActions.enable.ID:
            return {
                state: action.payload.value,
            };
        default:
            return state;
    }
}
