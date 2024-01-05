// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { locatorInitialState } from "readium-desktop/common/redux/states/locatorInitialState";

import { LocatorExtended } from "@r2-navigator-js/electron/renderer";

import { readerLocalActionSetLocator } from "../actions";

function readerLocatorReducer_(
    state: LocatorExtended = locatorInitialState,
    action: readerLocalActionSetLocator.TAction,
): LocatorExtended {

    switch (action.type) {
        case readerLocalActionSetLocator.ID:

            return {
                ...action.payload,
            };
        default:
            return state;
    }
}

export const readerLocatorReducer = readerLocatorReducer_ as Reducer<ReturnType<typeof readerLocatorReducer_>>;
