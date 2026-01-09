// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { themeActions } from "../actions";
import { ITheme } from "../states/theme";

function themeReducer_(
    state: ITheme = {
        name: "system",
    },
    action: themeActions.setTheme.TAction,
): ITheme {
    switch (action.type) {
        case themeActions.setTheme.ID:
            return {
                name: action.payload.name ? action.payload.name : state.name,
            };
        default:
            return state;
    }
}

export const themeReducer = themeReducer_ as Reducer<ReturnType<typeof themeReducer_>>;
