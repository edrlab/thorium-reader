// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { TMethodApi, TModuleApi } from "readium-desktop/main/di";

import { Meta } from "./types";

export const ID = "API_REQUEST";

export function build(requestId: string, moduleId: TModuleApi, methodId: TMethodApi, payload?: any):
    Action<typeof ID, any, Meta> {

    return {
        type: ID,
        payload,
        meta: {
            api: {
                requestId,
                moduleId,
                methodId,
            },
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
