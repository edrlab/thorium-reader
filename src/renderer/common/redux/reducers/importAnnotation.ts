// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";
import { IImportAnnotationState } from "../../../../common/redux/states/importAnnotation";
import { annotationActions } from "readium-desktop/common/redux/actions";

const initialState: IImportAnnotationState = {
    open: false,
    annotationsList: [],
    annotationsConflictList: [],
    about: undefined,
    title: "",
    generated: "",
    generator: undefined,
};

function importAnnotationReducer_(
    state: IImportAnnotationState = initialState,
    action: annotationActions.importTriggerModal.TAction | annotationActions.importConfirmOrAbort.TAction,
    ): IImportAnnotationState {
        if (action.type === annotationActions.importTriggerModal.ID) {
            return {
                open: true,
                ...action.payload,
            };
        } else if (action.type === annotationActions.importConfirmOrAbort.ID) {
            return {
                ...initialState,
            };
        }
        return state;
}

export const importAnnotationReducer = importAnnotationReducer_ as Reducer<ReturnType<typeof importAnnotationReducer_>>;
