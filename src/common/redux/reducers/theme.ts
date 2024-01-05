// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { themeActions } from "../actions";
import { TTheme } from "../states/theme";

function themeReducer_(
    state: TTheme = "system",
    action: themeActions.setTheme.TAction,
): TTheme {
    switch (action.type) {
        case themeActions.setTheme.ID:
            return action.payload.theme;
        default:
            return state;
    }
}

export const themeReducer = themeReducer_ as Reducer<ReturnType<typeof themeReducer_>>;
