// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "ANALYTICS_APP_UPDATE_DETECTED";

export interface Payload {
    app_version: string;
    previous_app_version: string;
}

export function build(prevVersion: string, currentVersion: string): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            app_version: currentVersion,
            previous_app_version: prevVersion,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
