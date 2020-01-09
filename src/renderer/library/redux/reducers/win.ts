// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { winActions } from "readium-desktop/renderer/library/redux/actions";
import { WinState } from "readium-desktop/renderer/library/redux/states/win";

const initialState: WinState = {
    winId: undefined,
};

export function winReducer(
    state: WinState = initialState,
    action: winActions.initRequest.TAction,
    ): WinState {
    switch (action.type) {
        case winActions.initRequest.ID:
            return {
                ...{
                    winId: action.payload.winId,
                },
            };
        default:
            return state;
    }
}
