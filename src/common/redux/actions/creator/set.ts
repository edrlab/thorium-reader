// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { INoteCreator } from "../../states/creator";
import { v4 as uuidv4 } from "uuid";

export const ID = "CREATOR_SET";

export interface Payload extends INoteCreator {
}

export function build(name: string, type: INoteCreator["type"]): Action<typeof ID, Payload> {

    const uuid = uuidv4();
    return {
        type: ID,
        payload: {
            id: uuid,
            urn: `urn:uuid:${uuid}`,
            name,
            type,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
