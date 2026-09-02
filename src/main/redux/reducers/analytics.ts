// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer, type UnknownAction } from "redux";

import { IAnalyticsState } from "readium-desktop/main/redux/states/analytics";
import { uuidv4 } from "readium-desktop/utils/uuid";

const clientIdHex = uuidv4().replace(/-/g, "");
const initialState: IAnalyticsState = {
    clientId: `${parseInt(clientIdHex.slice(0, 8), 16) || 1}.${parseInt(clientIdHex.slice(8, 16), 16) || Math.floor(Date.now() / 1000)}`,
};

function analyticsReducer_(
    state: IAnalyticsState = initialState,
    _action: UnknownAction,
): IAnalyticsState {
    if (!state.clientId) {
        return initialState;
    }
    return state;
}

export const analyticsReducer = analyticsReducer_ as Reducer<ReturnType<typeof analyticsReducer_>>;
