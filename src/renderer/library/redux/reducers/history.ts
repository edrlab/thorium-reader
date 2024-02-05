// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { winActions } from "readium-desktop/renderer/library/redux/actions";

import { THistoryState } from "readium-desktop/common/redux/states/renderer/history";

const initialState: THistoryState = [];

export function historyReducer_(
    state: THistoryState = initialState,
    action: winActions.history.TAction,
): THistoryState {
    switch (action.type) {
        case winActions.history.ID:
            const history = state.slice();

            history.push(action.payload);

            return history;

        default:
            return state;

    }
}

export const historyReducer = historyReducer_ as Reducer<ReturnType<typeof historyReducer_>>;
