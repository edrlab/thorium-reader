// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerLocalActionAnnotations } from "../actions";
import { IAnnotationModeState } from "readium-desktop/common/redux/states/renderer/annotation";

function annotationModeFocusReducer_(
    state: IAnnotationModeState["focus"] = { currentFocusUuid: "", previousFocusUuid: "", editionEnable: false },
    action: readerLocalActionAnnotations.focusMode.TAction,
): IAnnotationModeState["focus"] {

    switch (action.type) {
        case readerLocalActionAnnotations.focusMode.ID:
            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}

export const annotationModeFocusReducer = annotationModeFocusReducer_ as Reducer<ReturnType<typeof annotationModeFocusReducer_>>;
