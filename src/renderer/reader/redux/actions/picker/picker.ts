// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IPickerState } from "readium-desktop/common/redux/states/renderer/picker";

export const ID = "READER_PICKER";

type TP = Pick<IPickerState, "open"> & Partial<IPickerState>;
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload extends TP {
}

export function build(open: IPickerState["open"], type?: IPickerState["type"]):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            open,
            type,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
