// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { appActions } from "readium-desktop/main/redux/actions";
import { AppState, AppStatus } from "readium-desktop/main/redux/states/app";

const initialState: AppState = {
    status: AppStatus.Unknown,
};

export function appReducer(
    state: AppState = initialState,
    action: Action,
) {
    switch (action.type) {
        case appActions.ActionType.InitSuccess:
            return Object.assign({}, state, {
                status: AppStatus.Initialized,
            });
        case appActions.ActionType.InitError:
            return Object.assign({}, state, {
                status: AppStatus.Error,
            });
        default:
            return state;
    }
}
