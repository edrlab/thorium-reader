// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { WinState } from "readium-desktop/common/redux/states/win";

const initialState: WinState = {
    identifier: undefined,
};

function winReducer_(
    state: WinState = initialState,
    action: winActions.initRequest.TAction,
    ): WinState {
    switch (action.type) {
        case winActions.initRequest.ID:
            return {
                ...{
                    identifier: action.payload.identifier,
                },
            };
        default:
            return state;
    }
}

export const winReducer = winReducer_ as Reducer<ReturnType<typeof winReducer_>>;
