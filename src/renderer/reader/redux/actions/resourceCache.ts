// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";

export const ID = "READER_RESOURCE_SET_CACHE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload {
    searchDocument: ICacheDocument[];
}

export function build(data: ICacheDocument[]):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            searchDocument: data,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
