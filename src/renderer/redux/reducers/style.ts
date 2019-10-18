// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { styleActions } from "readium-desktop/common/redux/actions";
import { StyleState } from "readium-desktop/renderer/redux/states/style";

const initialState: StyleState = {
    highContrast: {
        enabled: false,
        colors: {
            background: undefined,
            text: undefined,
            buttonBackground: undefined,
            buttonText: undefined,
            highlight: undefined,
            highlightText: undefined,
            disabled: undefined,
        },
    },
};

export function styleReducer(
    state: StyleState = initialState,
    action: Action<StyleState>,
): StyleState {
    switch (action.type) {
        case styleActions.ActionType.HighContrastChanged:
            return Object.assign({}, state, {
                highContrast: action.payload,
            });
        default:
            return state;
    }
}
