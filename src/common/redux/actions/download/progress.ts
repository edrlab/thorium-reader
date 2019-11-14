// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "DOWNLOAD_PROGRESS";

export interface Payload {
    url: string;
    progress: number; // integer [0, 100]
}

export function build(url: string, progress: number):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            url,
            progress,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
