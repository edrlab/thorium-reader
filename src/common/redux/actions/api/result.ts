// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CodeError } from "readium-desktop/common/errors";
import { Action } from "readium-desktop/common/models/redux";

import { Meta, MetaApi } from "./types";

export const ID = "API_RESULT";

export function build(api: MetaApi, payload: any):
    Action<typeof ID, any, Meta> {

    return {
        type: ID,
        payload,
        meta: {
            api: {
                requestId: api.requestId,
                moduleId: api.moduleId,
                methodId: api.methodId,
            },
        },
        error: payload instanceof CodeError,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
