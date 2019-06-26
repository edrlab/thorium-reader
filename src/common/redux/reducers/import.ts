// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { ActionType } from "readium-desktop/common/redux/actions/import";

import { ImportState } from "../states/import";

const initialState: ImportState = {
    publication: undefined,
    downloadSample: false,
};

// The dialog reducer.
export function importReducer(
    state: ImportState = initialState,
    action: Action,
) {
    switch (action.type) {
        case ActionType.ImportVerificationRequest:
            return Object.assign(
                {},
                state,
                {
                    publication: action.payload.data.publication,
                    downloadSample: action.payload.data.downloadSample,
                },
            );
        default:
            return state;
    }
}
