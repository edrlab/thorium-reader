// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import { ActionType, ApiAction } from "readium-desktop/common/redux/actions/api";
import {
    ApiDataResponse, ApiState, LAST_API_SUCCESS_ID,
} from "readium-desktop/renderer/redux/states/api";

const initialState: ApiState<any> = {
    [LAST_API_SUCCESS_ID]: undefined,
};

// The api reducer.
export function apiReducer(
    state: ApiState<any> = initialState,
    action: ApiAction,
) {

    switch (action.type) {
        case ActionType.Result:
            const now = moment.now();
            const requestId = action.meta.api.requestId;
            const data: ApiDataResponse<any> = action.error ?
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
            let returnState: ApiState<any>;
            if (!state[requestId]) {
                returnState = {
                    ...state,
                    [requestId]: {
                        data,
                        lastSuccess: undefined,
                        lastTime: 0,
                    },
                };
            } else {
                const requestState = { ...state[requestId] };
                requestState.lastSuccess = requestState.data.error === false &&
                    requestState.data;
                requestState.lastTime = requestState.data.time;
                requestState.data = data;
                returnState = {
                    ...state,
                    [requestId]: requestState,
                };
            }
            if (action.error) {
                return {
                    ...returnState,
                };
            }
            return {
                ...returnState,
                [LAST_API_SUCCESS_ID]: returnState[requestId],
            };

        case ActionType.Clean:
            const newState = { ...state };
            delete newState[action.payload.requestId];
            return newState;

        default:
            return state;
    }
}
