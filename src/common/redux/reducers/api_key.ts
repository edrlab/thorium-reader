// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { apiKeysActions } from "../actions";
import { IApiKeysArray } from "../states/api_key";

const initialState: IApiKeysArray = [];

function apiKeysReducer_(
    state = initialState,
    action: apiKeysActions.set.TAction | apiKeysActions.removeKey.TAction,
): IApiKeysArray {

    switch (action.type) {
        case apiKeysActions.set.ID:
            return [
                ...state,
                {
                    provider: action.payload.provider,
                    key: action.payload.key,
                    submitted: action.payload.submitted,
                },
            ];
        case apiKeysActions.removeKey.ID:
            return state.filter(
                key => key.provider !== action.payload.provider || key.key !== action.payload.key,
            );
        default:
            return state;
    }
}


export const apiKeysReducer = apiKeysReducer_ as Reducer<ReturnType<typeof apiKeysReducer_>>;
