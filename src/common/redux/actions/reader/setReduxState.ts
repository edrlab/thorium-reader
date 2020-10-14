
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";

export const ID = "READER_SET_REDUXSTATE";

export interface Payload {
    reduxState: Partial<IReaderStateReader>;
    winId: string;
}

export function build(winId: string, reduxState: Payload["reduxState"]):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            reduxState,
            winId,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
