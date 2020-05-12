// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig } from "readium-desktop/common/models/reader";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";

export function readerDefaultConfigReducer(
    state: ReaderConfig = readerConfigInitialState,
    action: readerActions.configSetDefault.TAction,
): ReaderConfig {

    switch (action.type) {
        case readerActions.configSetDefault.ID:
            return {
                ...state,
                ...action.payload.config,
            };

        default:
            return state;
    }
}
