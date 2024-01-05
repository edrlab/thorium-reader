// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { loadActions } from "readium-desktop/common/redux/actions";

import { ILoadState } from "../states/load";

const initialState: ILoadState = {
    state: false,
};

function loadReducer_(
    state: ILoadState = initialState,
    action: loadActions.busy.TAction | loadActions.idle.TAction,
    ): ILoadState {
        if (action.type === loadActions.busy.ID) {
            return {
                state: true,
            };
        } else if (action.type === loadActions.idle.ID) {
            return {
                state: false,
            };
        }
        return state;
}

export const loadReducer = loadReducer_ as Reducer<ReturnType<typeof loadReducer_>>;
