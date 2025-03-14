// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderConfigSettingsMenuState, IReaderDialogOrDockSettingsMenuState } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";

export const ID = "READER_TOGGLE_MENU";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload extends Partial<Pick<IReaderConfigSettingsMenuState, "readerDockingMode">>, Partial<IReaderDialogOrDockSettingsMenuState> {
    open?: boolean,
    section?: string;
    focus?: boolean;
}

export function build(data: Payload):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: data,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
