// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DockType } from "readium-desktop/common/models/dock";
import { Action } from "readium-desktop/common/models/redux";

export const ID = "DOCK_UPDATE_REQUEST";

export interface Payload<T extends keyof DockType> {
    data: DockType[T];
}

export function build<T extends keyof DockType>(data: DockType[T]):
    Action<typeof ID, Payload<T>> {

    return {
        type: ID,
        payload: {
            data,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
