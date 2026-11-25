// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { routerActions, winActions } from "readium-desktop/renderer/library/redux/actions";
import { Action as HistoryAction } from "history";

import { INavigationHistoryState, THistoryState } from "readium-desktop/common/redux/states/renderer/history";

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

function navigationHistoryReducer_(
    state: INavigationHistoryState = { keys: [], index: -1 },
    action: routerActions.locationChanged.TAction,
): INavigationHistoryState {
    if (action.type !== routerActions.locationChanged.ID) return state;
    const { location, action: historyAction } = action.payload;
    if (historyAction === HistoryAction.Pop) {
        const index = state.keys.indexOf(location.key);
        return index < 0 ? { keys: [location.key], index: 0 } : { ...state, index };
    }
    if (historyAction === HistoryAction.Replace && state.index >= 0) {
        const keys = state.keys.slice();
        keys[state.index] = location.key;
        return { keys, index: state.index };
    }
    const keys = [...state.keys.slice(0, state.index + 1), location.key];
    return { keys, index: keys.length - 1 };
}

export const navigationHistoryReducer = navigationHistoryReducer_ as Reducer<INavigationHistoryState>;
