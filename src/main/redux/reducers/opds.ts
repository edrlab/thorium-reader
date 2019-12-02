// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CatalogState } from "readium-desktop/common/redux/states/catalog";
import { opdsActions } from "readium-desktop/main/redux/actions";

const initialState: CatalogState = {
    accessTokens: undefined,
};

export function opdsReducer(
    state: CatalogState = initialState,
    action: opdsActions.accessToken.TAction,
) {
    switch (action.type) {
        case opdsActions.accessToken.ID:
            const obj: { [key: string]: string } = {};
            obj[action.payload.domain] = action.payload.accessToken;
            return Object.assign({}, state,
                {
                    accessTokens: Object.assign(
                        {},
                        state.accessTokens ? state.accessTokens : {},
                        obj,
                    ),
                },
            );
        default:
            return state;
    }
}
