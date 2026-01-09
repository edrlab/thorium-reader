// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { screenReaderActions } from "../actions";
import { IScreenReaderState } from "../states/screenReader";

const initialState: IScreenReaderState = {
    activate: false,
};

function screenReaderReducer_(
    state = initialState,
    action: screenReaderActions.save.TAction,
): IScreenReaderState {
    switch (action.type) {
        case screenReaderActions.save.ID:
            return {
                // state: state.state,
                activate: action.payload.value,
            };
        default:
            return state;
    }
}

export const screenReaderReducer = screenReaderReducer_ as Reducer<ReturnType<typeof screenReaderReducer_>>;
