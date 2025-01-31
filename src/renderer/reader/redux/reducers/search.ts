// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerLocalActionSearch } from "../actions";
import { ISearchState, searchDefaultState } from "readium-desktop/common/redux/states/renderer/search";

function searchReducer_(
    state: ISearchState = searchDefaultState(),
    action: readerLocalActionSearch.cancel.TAction |
    readerLocalActionSearch.request.TAction |
    readerLocalActionSearch.focus.TAction |
    readerLocalActionSearch.found.TAction |
    readerLocalActionSearch.enable.TAction,
): ISearchState {

    switch (action.type) {
        case readerLocalActionSearch.request.ID:
        case readerLocalActionSearch.cancel.ID:
        case readerLocalActionSearch.enable.ID:
        case readerLocalActionSearch.focus.ID:
        case readerLocalActionSearch.found.ID:

            // let found = state.foundArray;
            // if (action.payload.foundArray) {
            //     found = [
            //         ...state.foundArray,
            //         ...action.payload.foundArray,
            //     ];
            // }

            return {
                ...state,
                ...action.payload,
                // ...{
                //     foundArray: found,
                // },
            };
        default:
            return state;
    }
}

export const searchReducer = searchReducer_ as Reducer<ReturnType<typeof searchReducer_>>;
