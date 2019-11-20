// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import { OpdsNavigationLink, OpdsState } from "readium-desktop/renderer/redux/states/opds";

// Logger
const debug = debug_("readium-desktop:renderer:redux:reducer:opds");

const initialState: OpdsState = {
    browser: {
        navigation: [],
    },
};

export function opdsReducer(
    state: OpdsState = initialState,
    action: opdsActions.browseRequest.TAction,
) {
    switch (action.type) {
        case opdsActions.browseRequest.ID:
            const browser = {
                navigation: [] as OpdsNavigationLink[],
            };

            const { level, title, url } = action.payload;
            debug("Level:", level);
            debug("Navigation:", state.browser.navigation);

            // what is the purpose of this line : level = state.browser.navigation.length + 1
            browser.navigation = state.browser.navigation.slice(0, level - 1);

            browser.navigation.push({ level, title, url });
            return Object.assign({}, state, { browser });
        default:
            return state;
    }
}
