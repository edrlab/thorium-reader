// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IProfile } from "../../states/profile";

export const ID = "SET_APP_PROFILE";

export interface Payload {
    profile: IProfile;
}

export function build(profile: IProfile): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            profile: profile,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
