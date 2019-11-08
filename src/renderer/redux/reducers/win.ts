// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { winActions } from "readium-desktop/renderer/redux/actions";
import { ActionPayloadWin } from "readium-desktop/renderer/redux/actions/win";
import { WinState, WinStatus } from "readium-desktop/renderer/redux/states/win";

const initialState: WinState = {
    status: WinStatus.Unknown,
    winId: null,
};

export function winReducer(
    state: WinState = initialState,
    action: Action<string, ActionPayloadWin>,
) {
    switch (action.type) {
        case winActions.ActionType.InitRequest:
            return Object.assign({}, state, {
                winId: action.payload.winId,
            });
        case winActions.ActionType.InitSuccess:
            return Object.assign({}, state, {
                status: WinStatus.Initialized,
            });
        case winActions.ActionType.InitError:
            return Object.assign({}, state, {
                status: WinStatus.Error,
            });
        default:
            return state;
    }
}
