// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ActionPayloadImportVerificationRequest, ActionType } from "readium-desktop/common/redux/actions/import";

import { ImportState } from "../states/import";

const initialState: ImportState = {
    opdsPublicationView: undefined,
    downloadSample: false,
};

export function importReducer(
    state: ImportState = initialState,
    action: Action<string, ActionPayloadImportVerificationRequest>,
) {
    switch (action.type) {
        case ActionType.ImportVerificationRequest:
            return Object.assign(
                {},
                state,
                {
                    opdsPublicationView: action.payload.data.opdsPublicationView,
                    downloadSample: action.payload.data.downloadSample,
                },
            );
        default:
            return state;
    }
}
