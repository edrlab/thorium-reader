// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { whatsNewActions } from "../actions";
import { IWhatsNewState } from "../states/whatsNew";

const initialState: IWhatsNewState = {
    opened_v350: false,
};

function whatsNewReducer_(
    state = initialState,
    action: whatsNewActions.setWhatsNew.TAction,
): IWhatsNewState {
    switch (action.type) {
        case whatsNewActions.setWhatsNew.ID:
            return action.payload;
        default:
            return state;
    }
}

export const whatsNewReducer = whatsNewReducer_ as Reducer<ReturnType<typeof whatsNewReducer_>>;
