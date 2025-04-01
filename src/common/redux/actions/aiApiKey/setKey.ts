// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { AiProviderType, IApiKey } from "../../states/api_key";

export const ID = "API_KEY_SET";

export interface Payload extends IApiKey {
}

export function build(key: string, provider: AiProviderType): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            key,
            provider,
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
