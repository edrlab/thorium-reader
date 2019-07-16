// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    LocaleSetRequest = "LOCALE_SET_REQUEST",
    LocaleSetSuccess = "LOCALE_SET_SUCCESS",
    LocaleSetError = "LOCALE_SET_ERROR",
}

export function setLocale(locale: string): Action {
    return {
        type: ActionType.LocaleSetRequest,
        payload: {
            locale,
        },
    };
}
