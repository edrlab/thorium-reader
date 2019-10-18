// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { exportActions } from "readium-desktop/common/redux/actions";
import { ExportState } from "readium-desktop/renderer/redux/states/export";

const initialState: ExportState = {
    dialogOpen: false,
};

export function exportReducer(
    state: ExportState = initialState,
    action: Action,
) {
    switch (action.type) {
        case exportActions.ActionType.ExportDialogClose:
            return Object.assign({}, state, { dialogOpen: false });
        case exportActions.ActionType.ExportDialogOpen:
                return Object.assign({}, state, { dialogOpen: true });
        default:
            return state;
    }
}
