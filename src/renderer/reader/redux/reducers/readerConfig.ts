// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { ReaderConfig } from "readium-desktop/common/models/reader";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { readerLocalActionSetConfig } from "../actions";

function readerConfigReducer_(
    state: ReaderConfig = readerConfigInitialState,
    action: readerLocalActionSetConfig.TAction,
): ReaderConfig {

    switch (action.type) {
        case readerLocalActionSetConfig.ID:

            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}

export const readerConfigReducer = readerConfigReducer_ as Reducer<ReturnType<typeof readerConfigReducer_>>;
