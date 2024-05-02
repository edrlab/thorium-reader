// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { wizardActions } from "../actions";
import { IWizardState } from "../states/wizard";

const initialState: IWizardState = {
    opened: false,
};

function wizardReducer_(
    state = initialState,
    action: wizardActions.setWizard.TAction,
): IWizardState {
    switch (action.type) {
        case wizardActions.setWizard.ID:
            return action.payload;
        default:
            return state;
    }
}

export const wizardReducer = wizardReducer_ as Reducer<ReturnType<typeof wizardReducer_>>;
