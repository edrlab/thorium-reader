// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export enum ActionType {
    Set = "LOCALE_SET",
}

export interface PayloadLocale {
    locale: string;
}

export interface ActionLocale extends Action<string, PayloadLocale> {
}

export function setLocale(locale: string): ActionLocale {
    return {
        type: ActionType.Set,
        payload: {
            locale,
        },
    };
}
