// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { bookmarkTotalCount } from "readium-desktop/renderer/reader/redux/actions/reader";
import { defaultBookmarkTotalCountConfig, IBookmarkTotalCountState } from "readium-desktop/renderer/reader/redux/state/bookmarkTotalCount";
import { type Reducer } from "redux";


export const initialState: IBookmarkTotalCountState = {
    state: defaultBookmarkTotalCountConfig,
};

function readerBookmarkTotalCountReducer_(
    state: IBookmarkTotalCountState = initialState, // (preloaded state?) see registerReader
    action: bookmarkTotalCount.TAction,
): IBookmarkTotalCountState {
    switch (action.type) {
        case bookmarkTotalCount.ID:
            return {
                state: action.payload.state,
            };
        default:
            return state;
    }
}
export const readerBookmarkTotalCountReducer = readerBookmarkTotalCountReducer_ as Reducer<ReturnType<typeof readerBookmarkTotalCountReducer_>>;
