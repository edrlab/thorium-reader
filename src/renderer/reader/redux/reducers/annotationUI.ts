// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerLocalActionAnnotationUI } from "../actions";
import { IAnnotationUserInterfaceState, annotationDefaultState } from "../state/annotation";

export function annotationUIReducer(
    state: IAnnotationUserInterfaceState = annotationDefaultState(),
    action: readerLocalActionAnnotationUI.color.TAction |
    readerLocalActionAnnotationUI.enable.TAction |
    readerLocalActionAnnotationUI.focus.TAction |
    readerLocalActionAnnotationUI.cancel.TAction,
): IAnnotationUserInterfaceState {

    switch (action.type) {
        case readerLocalActionAnnotationUI.cancel.ID:
        case readerLocalActionAnnotationUI.enable.ID:
        case readerLocalActionAnnotationUI.focus.ID:
        case readerLocalActionAnnotationUI.color.ID:

            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}
