// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { ISettingsState } from "readium-desktop/common/redux/states/settings";
import { settingsActions } from "readium-desktop/common/redux/actions";

const initialState: ISettingsState = {
    enableAPIAPP: false,
};

function settingsReducer_(
    state: ISettingsState = initialState,
    action: settingsActions.enableAPIAPP.TAction,
):  ISettingsState {
    switch (action.type) {
        case settingsActions.enableAPIAPP.ID:
            return {
                enableAPIAPP: action.payload.enableAPIAPP,
            };

        default:
            return state;
    }
}

export const settingsReducer = settingsReducer_ as Reducer<ReturnType<typeof settingsReducer_>>;
