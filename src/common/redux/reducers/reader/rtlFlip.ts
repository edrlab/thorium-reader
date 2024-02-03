// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { disableRTLFlip } from "../../actions/reader";
import { IRTLFlipState } from "../../states/renderer/rtlFlip";

const initialState: IRTLFlipState = {
    disabled: false,
};

function readerRTLFlipReducer_(
    state: IRTLFlipState = initialState, // (preloaded state?) see registerReader
    action: disableRTLFlip.TAction,
): IRTLFlipState {
    switch (action.type) {
        case disableRTLFlip.ID:
            return {
                disabled: action.payload.disabled,
            };
        default:
            return state;
    }
}
export const readerRTLFlipReducer = readerRTLFlipReducer_ as Reducer<ReturnType<typeof readerRTLFlipReducer_>>;
