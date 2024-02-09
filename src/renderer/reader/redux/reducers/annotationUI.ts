// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Reducer } from "redux";
import { readerLocalActionAnnotationUI } from "../actions";
import { IAnnotationUserInterfaceState, annotationDefaultState } from "readium-desktop/common/redux/states/renderer/annotation";

function annotationUIReducer_(
    state: IAnnotationUserInterfaceState = annotationDefaultState(),
    action: readerLocalActionAnnotationUI.color.TAction |
    readerLocalActionAnnotationUI.enable.TAction |
    readerLocalActionAnnotationUI.focus.TAction |
    readerLocalActionAnnotationUI.cancel.TAction |
    readerLocalActionAnnotationUI.picker.TAction,
): IAnnotationUserInterfaceState {


    switch (action.type) {
        case readerLocalActionAnnotationUI.cancel.ID:
        case readerLocalActionAnnotationUI.enable.ID:
        case readerLocalActionAnnotationUI.focus.ID:
        case readerLocalActionAnnotationUI.color.ID:
        case readerLocalActionAnnotationUI.picker.ID:

            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}

export const annotationUIReducer = annotationUIReducer_ as Reducer<ReturnType<typeof annotationUIReducer_>>;