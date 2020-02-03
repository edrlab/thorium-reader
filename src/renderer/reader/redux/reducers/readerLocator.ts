// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Locator } from "@r2-shared-js/models/locator";
import { readerLocalActionSetLocator } from "../actions";

export function readerLocatorReducer(
    state: Locator,
    action: readerLocalActionSetLocator.TAction,
): Locator {

    switch (action.type) {
        case readerLocalActionSetLocator.ID:

            return {
                ...action.payload,
            };
        default:
            return state;
    }
}
