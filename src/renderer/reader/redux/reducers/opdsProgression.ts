// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Reducer } from "redux";

import { readerActions } from "readium-desktop/common/redux/actions";
import type { IOpdsProgressionState } from "readium-desktop/common/redux/states/renderer/opdsProgression";

type TAction = readerActions.setOpdsProgression.TAction | readerActions.clearOpdsProgression.TAction | readerActions.setOpdsProgressionState.TAction;

export const opdsProgressionReducer: Reducer<IOpdsProgressionState, TAction> = (
    state = {},
    action,
) => {
    switch (action.type) {
        case readerActions.setOpdsProgression.ID:
            return { ...state, document: action.payload.document };
        case readerActions.clearOpdsProgression.ID:
            return { ...state, document: undefined };
        case readerActions.setOpdsProgressionState.ID:
            return action.payload.state;
        default:
            return state;
    }
};
