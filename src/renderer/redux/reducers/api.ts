// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";

import { apiActions } from "readium-desktop/common/redux/actions/";
import { ApiState } from "readium-desktop/renderer/redux/states/api";

const initialState: ApiState<any> = {
    data: {},
    lastSuccess: null,
};

// The api reducer.
export function apiReducer(
    state: ApiState<any> = initialState,
    action: apiActions.error.TAction |
        apiActions.success.TAction |
        apiActions.clean.TAction,
) {
    const resultIsReject = action.type === apiActions.error.ID;

    switch (action.type) {
        case apiActions.error.ID:
        case apiActions.success.ID:
            const act1 = action as apiActions.success.TAction;
            const data = state.data;
            const now = moment.now();
            // Why here is it not immutable ?
            data[act1.meta.api.requestId] = {
                result: act1.payload,
                resultIsReject,
                requestId: act1.meta.api.requestId,
                moduleId: act1.meta.api.moduleId,
                methodId: act1.meta.api.methodId,
                date: now,
            };
            return Object.assign(
                {},
                state,
                {
                    data,
                    lastSuccess: {
                        action,
                        date: now,
                    },
                },
            );
        case apiActions.clean.ID:
            const act2 = action as apiActions.clean.TAction;
            const newState = Object.assign({}, state);
            delete newState.data[act2.payload.requestId];
            return newState;
        default:
            return state;
    }
}
