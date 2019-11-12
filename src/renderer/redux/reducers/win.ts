// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { winActions } from "readium-desktop/renderer/redux/actions";
import { WinState, WinStatus } from "readium-desktop/renderer/redux/states/win";

const initialState: WinState = {
    status: WinStatus.Unknown,
    winId: null,
};

export function winReducer(
    state: WinState = initialState,
    action: winActions.initRequest.TAction |
        winActions.initSuccess.TAction |
        winActions.initError.TAction,
) {
    switch (action.type) {
        case winActions.initRequest.ID:
            return Object.assign({}, state, {
                winId: action.payload.winId,
            });
        case winActions.initSuccess.ID:
            return Object.assign({}, state, {
                status: WinStatus.Initialized,
            });
        case winActions.initError.ID:
            return Object.assign({}, state, {
                status: WinStatus.Error,
            });
        default:
            return state;
    }
}
