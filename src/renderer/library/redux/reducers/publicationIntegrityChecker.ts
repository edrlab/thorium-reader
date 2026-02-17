// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { IPublicationCheckerState } from "readium-desktop/common/redux/states/publicationsChecker";
import { publicationActions } from "readium-desktop/common/redux/actions";
import { publicationActions as publicationActionsLibrary } from "../actions";

const initialState: {
        open: true;
    } & IPublicationCheckerState | { open: false } = {
    open: false,
};

function publicationIntegrityCheckerReducer_(
    state: {
        open: true;
    } & IPublicationCheckerState | { open: false } = initialState,
    action: publicationActionsLibrary.closePublicationChecker.TAction | publicationActions.checker.TAction,
):  {
        open: true;
    } & IPublicationCheckerState | { open: false } {
    switch (action.type) {
        case publicationActionsLibrary.closePublicationChecker.ID:
            return action.payload;
        case publicationActions.checker.ID:
            return action.payload;
        default:
            return state;
    }
}

export const publicationIntegrityCheckerReducer = publicationIntegrityCheckerReducer_ as Reducer<ReturnType<typeof publicationIntegrityCheckerReducer_>>;
