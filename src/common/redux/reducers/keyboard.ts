// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { _defaults } from "readium-desktop/common/keyboard";
import { keyboardActions } from "readium-desktop/common/redux/actions";
import { KeyboardState } from "readium-desktop/common/redux/states/keyboard";

const initialState: KeyboardState = {
    shortcuts: _defaults,
};

export function keyboardReducer(
    state: KeyboardState = initialState,
    action: keyboardActions.setShortcuts.TAction,
    ): KeyboardState {
    switch (action.type) {
        case keyboardActions.setShortcuts.ID:
            return Object.assign({}, state, {
                shortcuts: action.payload.shortcuts,
            } as KeyboardState);
        default:
            return state;
    }
}
