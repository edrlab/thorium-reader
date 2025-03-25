// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IApiKey } from "../../states/api_key";

export const ID = "API_KEY_REMOVE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IPayload extends Pick<IAnnotationState, "uuid"> {
interface IPayload extends IApiKey {
}

export function build(param: IApiKey):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {...param},
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
