// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerLocalActionAnnotations } from "../actions";
import { IAnnotationModeState } from "readium-desktop/common/redux/states/renderer/annotation";

function annotationModeEnableReducer_(
    state: IAnnotationModeState["mode"] = { enable: false },
    action: readerLocalActionAnnotations.enableMode.TAction,
): IAnnotationModeState["mode"] {

    switch (action.type) {
        case readerLocalActionAnnotations.enableMode.ID:
            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}

export const annotationModeEnableReducer = annotationModeEnableReducer_ as Reducer<ReturnType<typeof annotationModeEnableReducer_>>;
