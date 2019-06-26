// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { PublicationView } from "readium-desktop/common/views/publication";

export enum ActionType {
    UserKeyCheckRequest = "LCP_USER_KEY_CHECK_REQUEST",
}

export function checkUserKey(publication: PublicationView, hint: string): Action {
    return {
        type: ActionType.UserKeyCheckRequest,
        payload: {
            publication,
            hint,
        },
    };
}
