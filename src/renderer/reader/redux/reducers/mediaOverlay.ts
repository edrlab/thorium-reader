// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { IMediaOverlayState, defaultMediaOverlayState } from "../state/mediaOverlay";
import { setMediaOverlayState } from "../actions/reader";

export const initialState: IMediaOverlayState = {
    state: defaultMediaOverlayState,
};

function readerMediaOverlayReducer_(
    state: IMediaOverlayState = initialState, // (preloaded state?) see registerReader
    action: setMediaOverlayState.TAction,
): IMediaOverlayState {
    switch (action.type) {
        case setMediaOverlayState.ID:
            return {
                state: action.payload.state,
            };
        default:
            return state;
    }
}
export const readerMediaOverlayReducer = readerMediaOverlayReducer_ as Reducer<ReturnType<typeof readerMediaOverlayReducer_>>;
