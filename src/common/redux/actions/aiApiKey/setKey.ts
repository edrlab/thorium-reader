// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IAiApiKey } from "../../states/ai_apiKey";
import { AIProviderFamily } from "readium-desktop/common/AIModels";

export const ID = "API_KEY_SET";

export interface Payload {
    aiKey: IAiApiKey,
}

export function build(aiKey: string, provider: AIProviderFamily): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            aiKey: {
                aiKey,
                provider,
            },
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
