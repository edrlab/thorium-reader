// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import { apiActions } from "readium-desktop/common/redux/actions/";
import {
    ApiDataResponse, ApiState, LAST_API_SUCCESS_ID,
} from "readium-desktop/common/redux/states/api";

const initialState: ApiState<any> = {
    [LAST_API_SUCCESS_ID]: undefined,
};

// The api reducer.
export function apiReducer(
    state: ApiState<any> = initialState,
    action: apiActions.result.TAction |
        apiActions.clean.TAction,
): ApiState<any> {

    switch (action.type) {
        case apiActions.result.ID:
            const now = moment.now();
            const requestId = action.meta.api.requestId;

            // format the received API payload
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

            // format the API state with the data received on the request channel Id
            let returnState: ApiState<any>;
            if (!state[requestId]) {

                // if it is the first request channel
                // initialize the channel with no data lastSuccess data and no previous timestamp
                returnState = {
                    ...state,
                    [requestId]: {
                        data,
                        lastSuccess: undefined,
                        lastTime: 0,
                    },
                };
            } else {

                // if the channel exists
                // setup actual data on lastSuccess, actual time on lastTime and set the new data on data
                const requestState = {
                    ...state[requestId],
                };
                requestState.lastSuccess = requestState.data.error === false &&
                    requestState.data;
                requestState.lastTime = requestState.data.time;
                requestState.data = data;
                returnState = {
                    ...state,
                    [requestId]: requestState,
                };
            }

            // if an error happened in request
            // return the state whithout updated LAST_API_SUCCESS_ID
            if (action.error) {
                return {
                    ...returnState,
                };
            }

            // autherwise format lastApiSuccess for the refresh feature
            const lastApiSuccess = {
                ...state[LAST_API_SUCCESS_ID],
            };
            lastApiSuccess.lastSuccess = lastApiSuccess.data;
            lastApiSuccess.lastTime = lastApiSuccess.data?.time || 0;
            lastApiSuccess.data = returnState[requestId].data;

            // no error is happened
            // return all the API state and the lastApiSuccess dedicated channel
            return {
                ...returnState,
                [LAST_API_SUCCESS_ID]: lastApiSuccess,
            };

        case apiActions.clean.ID:
            const newState = {
                ...state,
            };

            // delete the requestId channel in payload
            delete newState[action.payload.requestId];
            return newState;

        default:
            return state;
    }
}
