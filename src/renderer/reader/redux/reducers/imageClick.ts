// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerLocalActionSetImageClick } from "../actions";
import { defaultImageClickState, IImageClickState } from "../state/imageClick";

function imageClickReducer_(
    state = defaultImageClickState,
    action: readerLocalActionSetImageClick.TAction,
): IImageClickState {

    switch (action.type) {
        case readerLocalActionSetImageClick.ID:

            return {
                ...action.payload,
            };
        default:
            return state;
    }
}

export const imageClickReducer = imageClickReducer_ as Reducer<ReturnType<typeof imageClickReducer_>>;
