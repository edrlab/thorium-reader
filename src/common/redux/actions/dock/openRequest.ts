// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { DockType, DockTypeName } from "readium-desktop/common/models/dock";
import { Action } from "readium-desktop/common/models/redux";
import { IReaderDialogOrDockSettingsMenuState } from "readium-desktop/common/models/reader";

export const ID = "DOCK_OPEN_REQUEST";

interface IDataPayload {
    [DockTypeName.ReaderMenu]: IReaderDialogOrDockSettingsMenuState;
    [DockTypeName.ReaderSettings]: IReaderDialogOrDockSettingsMenuState;
}

type TDockTypeOpen = DockType & IDataPayload;

export interface Payload<T extends keyof TDockTypeOpen> {
    type: T;
    data: TDockTypeOpen[T];
}

export function build<T extends keyof DockType>(type: T, data: TDockTypeOpen[T]):
    Action<typeof ID, Payload<T>> {

    return {
        type: ID,
        payload: {
            type,
            data,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
