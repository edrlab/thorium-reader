// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as uuid from "uuid";

import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { UserKeyCheckStatus } from "readium-desktop/common/models/lcp";

import { lcpActions } from "readium-desktop/common/redux/actions";
import { LcpState } from "readium-desktop/common/redux/states/lcp";

const initialState: LcpState = {
};

export function lcpReducer(
    state: LcpState = initialState,
    action: Action | ErrorAction,
): LcpState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case lcpActions.ActionType.UserKeyCheckRequest:
            newState.lastUserKeyCheckDate = Date.now();
            newState.lastUserKeyCheck = {
                hint: action.payload.hint,
                publication: action.payload.publication,
                status: UserKeyCheckStatus.Pending,
            };
            return newState;
        case lcpActions.ActionType.UserKeyCheckError:
            newState.lastUserKeyCheckDate = Date.now();
            newState.lastUserKeyCheck.status = UserKeyCheckStatus.Error;
            return newState;
        case lcpActions.ActionType.UserKeyCheckSuccess:
            newState.lastUserKeyCheckDate = Date.now();
            newState.lastUserKeyCheck.status = UserKeyCheckStatus.Success;
            return newState;
        default:
            return state;
    }
}
