// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { analyticsActions } from "readium-desktop/common/redux/actions";
import { IAnalyticsState } from "readium-desktop/common/redux/states/analytics";
import { uuidv4 } from "readium-desktop/utils/uuid";

const initialState: IAnalyticsState = {
    appFirstOpen: true,
    userId: uuidv4(),
};

function analyticsReducer_(
    state: IAnalyticsState = initialState,
    action: analyticsActions.appFirstOpenDone.TAction | analyticsActions.appUpdateDetected.TAction | analyticsActions.appUpdateDone.TAction,
): IAnalyticsState {

    if (action.type === analyticsActions.appFirstOpenDone.ID) {
        return {
            ...state,
            appFirstOpen: false,
        };
    }

    if (action.type === analyticsActions.appUpdateDetected.ID) {
        return {
            ...state,
            appUpdate: action.payload,
        };
    }

    if (action.type === analyticsActions.appUpdateDone.ID) {
        return {
            ...state,
            appUpdate: undefined,
        };
    }

    if (!state.userId) {
        return initialState;
    }

    return {
        appFirstOpen: false,
        ...state,
    };
}

export const analyticsReducer = analyticsReducer_ as Reducer<ReturnType<typeof analyticsReducer_>>;
