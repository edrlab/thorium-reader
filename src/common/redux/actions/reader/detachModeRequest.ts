// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ActionWithSender, WithSender } from "readium-desktop/common/models/sync";
import { Action } from "readium-desktop/common/models/redux";

export const ID = "READER_MODE_DETACH_REQUEST";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload {
}

export function build():
    Action<typeof ID, Payload>
    & Omit<ActionWithSender<typeof ID, Payload>, keyof WithSender> & Partial<WithSender>
    {

    return {
        type: ID,
        payload: {
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
