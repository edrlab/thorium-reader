// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ICustomizationLockInfo } from "readium-desktop/common/redux/states/customization";

export const ID = "CUSTOMIZATION_ACTIVATING_LOCK";

export interface Payload {
    state: "IDLE" | "DOWNLOAD" | "COPY" | "PROVISIONING" | "ACTIVATING";
    lockInfo: ICustomizationLockInfo;
}

export function build(state: "IDLE" | "DOWNLOAD" | "COPY" | "PROVISIONING" | "ACTIVATING", lockInfo?: ICustomizationLockInfo  ): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            state, lockInfo,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
