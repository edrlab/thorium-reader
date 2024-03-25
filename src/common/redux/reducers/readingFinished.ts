// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { IReadingFinished, defaultReadingFinished } from "../states/renderer/readingFinished";
import { readingFinished } from "../actions/reader";

export const initialState: IReadingFinished = {
    finished: defaultReadingFinished,
};

function readerReadingFinishedReducer_(
    state: IReadingFinished = initialState, // (preloaded state?) see registerReader
    action: readingFinished.TAction,
): IReadingFinished {
    switch (action.type) {
        case readingFinished.ID:
            return {
                finished: action.payload.finished,
            };
        default:
            return state;
    }
}
export const readerReadingFinishedReducer = readerReadingFinishedReducer_ as Reducer<ReturnType<typeof readerReadingFinishedReducer_>>;
