// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    InitRequest = "APP_INIT_REQUEST",
    InitError = "APP_INIT_ERROR",
    InitSuccess = "APP_INIT_SUCCESS",
}

export function appInit(): Action {
    return {
        type: ActionType.InitRequest,
    };
}
