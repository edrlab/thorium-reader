// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerLocalActionDivina } from "../actions";
import { defaultReadingMode, IDivinaState } from "../state/divina";

const defaultState: IDivinaState = {
    readingMode: defaultReadingMode,
};

export function readerDivinaReducer(
    state: IDivinaState = defaultState,
    action: readerLocalActionDivina.setReadingMode.TAction,
): IDivinaState {

    switch (action.type) {

        case readerLocalActionDivina.setReadingMode.ID: {

            return {
                ...state,
                ...action.payload,
            };
        }

        default:
            // nothing
    }

    return state;
}
