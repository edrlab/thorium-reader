// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerLocalActionSearch } from "../actions";
import { ISearchState, searchDefaultState } from "../state/search";

export function searchReducer(
    state: ISearchState = searchDefaultState(),
    action: readerLocalActionSearch.cancel.TAction |
    readerLocalActionSearch.request.TAction |
    readerLocalActionSearch.focus.TAction |
    readerLocalActionSearch.found.TAction |
    readerLocalActionSearch.enable.TAction |
    readerLocalActionSearch.setCache.TAction,
): ISearchState {

    switch (action.type) {
        case readerLocalActionSearch.request.ID:
        case readerLocalActionSearch.cancel.ID:
        case readerLocalActionSearch.enable.ID:
        case readerLocalActionSearch.focus.ID:
        case readerLocalActionSearch.setCache.ID:
        case readerLocalActionSearch.found.ID:

            // let found = state.foundArray;
            // if (action.payload.foundArray) {
            //     found = [
            //         ...state.foundArray,
            //         ...action.payload.foundArray,
            //     ];
            // }

            // let cache = state.cacheArray;
            // if (action.payload.cacheArray) {
            //     cache = [
            //         ...state.cacheArray,
            //         ...action.payload.cacheArray,
            //     ];
            // }

            return {
                ...state,
                ...action.payload,
                // ...{
                //     foundArray: found,
                //     cacheArray: cache,
                // },
            };
        default:
            return state;
    }
}
