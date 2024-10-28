// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { appActions } from "readium-desktop/main/redux/actions";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";

const initialState: string | null = null;

function versionReducer_(
    state: string | null = initialState,
    action: appActions.initSuccess.TAction,
): string | null {
    switch (action.type) {
        case appActions.initSuccess.ID:
            return _APP_VERSION;
        default:
            return state;
    }
}

export const versionReducer = versionReducer_ as Reducer<ReturnType<typeof versionReducer_>>;
