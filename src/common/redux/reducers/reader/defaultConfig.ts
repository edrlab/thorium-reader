// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { ReaderConfig } from "readium-desktop/common/models/reader";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";

function readerDefaultConfigReducer_(
    state: ReaderConfig = readerConfigInitialState,
    action: readerActions.configSetDefault.TAction,
): ReaderConfig {

    const ac = action as readerActions.configSetDefault.TAction;
    switch (action.type) {
        case readerActions.configSetDefault.ID:
            return {
                ...state,
                ...ac.payload.config,
            };

        default:
            return state;
    }
}

export const readerDefaultConfigReducer = readerDefaultConfigReducer_ as Reducer<ReaderConfig>;
