// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { allowCustom } from "readium-desktop/renderer/reader/redux/actions/reader";
import { IAllowCustomConfigState, defaultAllowCustomConfig } from "readium-desktop/renderer/reader/redux/state/allowCustom";
import { type Reducer } from "redux";


export const initialState: IAllowCustomConfigState = {
    state: defaultAllowCustomConfig,
};

function readerAllowCustomConfigReducer_(
    state: IAllowCustomConfigState = initialState, // (preloaded state?) see registerReader
    action: allowCustom.TAction,
): IAllowCustomConfigState {
    switch (action.type) {
        case allowCustom.ID:
            return {
                state: action.payload.state,
            };
        default:
            return state;
    }
}
export const readerAllowCustomConfigReducer = readerAllowCustomConfigReducer_ as Reducer<ReturnType<typeof readerAllowCustomConfigReducer_>>;
