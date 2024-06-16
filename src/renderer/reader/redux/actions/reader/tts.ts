// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TTSStateEnum } from "@r2-navigator-js/electron/renderer";
import { Action } from "readium-desktop/common/models/redux";

export const ID = "READER_SET_TTS_STATE";

export interface Payload {
    state: TTSStateEnum
}

export function build(state: TTSStateEnum):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            state,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
