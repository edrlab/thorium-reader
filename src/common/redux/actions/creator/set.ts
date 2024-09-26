// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IAnnotationCreator } from "../../states/creator";

export const ID = "CREATOR_SET";

export interface Payload extends Pick<IAnnotationCreator, "name" | "type"> {
}

export function build(name: string, type: IAnnotationCreator["type"]): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            name,
            type,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
