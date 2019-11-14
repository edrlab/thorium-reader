// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { importActions } from "readium-desktop/common/redux/actions/";

import { ImportState } from "../states/import";

const initialState: ImportState = {
    opdsPublicationView: undefined,
};

export function importReducer(
    state: ImportState = initialState,
    action: importActions.verify.TAction,
) {
    switch (action.type) {
        case importActions.verify.ID:
            return Object.assign(
                {},
                state,
                {
                    opdsPublicationView: action.payload.opdsPublicationView,
                },
            );
        default:
            return state;
    }
}
