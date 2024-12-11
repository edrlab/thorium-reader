// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ActionWithDestination } from "readium-desktop/common/models/sync";

export const ID = "READER_SET_THE_LOCK_INSTANCE";

export interface Payload {
}

export function build(readerWindowIdentifier: string):
    ActionWithDestination<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
        },
        destination: {
            identifier: readerWindowIdentifier,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
