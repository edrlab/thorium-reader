// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { versionUpdateActions } from "../actions";
import { IVersionUpdateState } from "readium-desktop/common/redux/states/version";

const initialState: IVersionUpdateState = {
    newVersionURL: undefined,
    newVersion: undefined,
};

function versionUpdateReducer_(
    state: IVersionUpdateState = initialState,
    action: versionUpdateActions.notify.TAction,
): IVersionUpdateState {
    switch (action.type) {
        case versionUpdateActions.notify.ID:
            return {
                newVersionURL: action.payload.url,
                newVersion: action.payload.version,
            };
        default:
            return state;
    }
}

export const versionUpdateReducer = versionUpdateReducer_ as Reducer<ReturnType<typeof versionUpdateReducer_>>;
