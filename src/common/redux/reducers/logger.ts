// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { loggerActions } from "readium-desktop/common/redux/actions";
import { ActionPayloadLoggerInfo } from "readium-desktop/common/redux/actions/logger";
import { LoggerState } from "readium-desktop/common/redux/states/logger";

const initialState: LoggerState = {
    lastMessage: null,
};

export function loggerReducer(
    state: LoggerState = initialState,
    action: Action<string, ActionPayloadLoggerInfo>,
) {
    switch (action.type) {
        case loggerActions.ActionType.Info:
            return Object.assign({}, state, {
                lastMessage: action.payload.message,
            });
        default:
            return state;
    }
}
