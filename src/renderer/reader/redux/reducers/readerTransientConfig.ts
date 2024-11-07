// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { ReaderConfigPublisher } from "readium-desktop/common/models/reader";
import { readerConfigInitialStateDefaultPublisher } from "readium-desktop/common/redux/states/reader";
import { readerLocalActionSetTransientConfig } from "../actions";

function readerTransientConfigReducer_(
    state: ReaderConfigPublisher = readerConfigInitialStateDefaultPublisher,
    action: readerLocalActionSetTransientConfig.TAction,
): ReaderConfigPublisher {

    switch (action.type) {
        case readerLocalActionSetTransientConfig.ID:

            const merge = { ...state, ...action.payload };
            return {
                font: merge.font,
                fontSize: merge.fontSize,
                pageMargins: merge.pageMargins,
                wordSpacing: merge.wordSpacing,
                letterSpacing: merge.letterSpacing,
                paraSpacing: merge.paraSpacing,
                lineHeight: merge.lineHeight,
            };
        default:
            return state;
    }
}

export const readerTransientConfigReducer = readerTransientConfigReducer_ as Reducer<ReturnType<typeof readerTransientConfigReducer_>>;
