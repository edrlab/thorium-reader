// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { ITTSState, defaultTTSState } from "../state/tts";
import { setTTSState } from "../actions/reader";

export const initialState: ITTSState = {
    state: defaultTTSState,
};

function readerTTSReducer_(
    state: ITTSState = initialState,
    action: setTTSState.TAction,
): ITTSState {
    switch (action.type) {
        case setTTSState.ID:
            return {
                state: action.payload.state,
            };
        default:
            return state;
    }
}
export const readerTTSReducer = readerTTSReducer_ as Reducer<ReturnType<typeof readerTTSReducer_>>;
