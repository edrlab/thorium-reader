// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";

import { ActionType, ApiAction } from "readium-desktop/common/redux/actions/api";
import { ApiState, ApiDataResponse } from "readium-desktop/renderer/redux/states/api";

const initialState: ApiState<any> = {};

// The api reducer.
export function apiReducer<T = any>(
    state: ApiState<T> = initialState,
    action: ApiAction,
) {

    switch (action.type) {
        case ActionType.Result:
            const now = moment.now();
            const requestId = action.meta.api.requestId;
            const data: ApiDataResponse<T> = action.error ?
                {
                    time: now,
                    error: true,
                    errorMessage: action.payload,
                } :
                {
                    time: now,
                    error: false,
                    methodId: action.meta.api.methodId,
                    moduleId: action.meta.api.moduleId,
                    result: action.payload,
                };
            if (!state[requestId]) {
                return {
                    ...state,
                    [requestId]: {
                        data,
                        lastSuccess: undefined,
                        lastTime: 0,
                    }
                };
            }
            const requestState = { ...state[requestId] };
            requestState.lastSuccess = requestState.data.error === false &&
                requestState.data;
            requestState.lastTime = requestState.data.time;
            requestState.data = data;
            return { ...state, [requestId]: requestState };

        case ActionType.Clean:
            delete state[requestId];
            return Object.assign({}, state);

        default:
            return state;
    }
}
