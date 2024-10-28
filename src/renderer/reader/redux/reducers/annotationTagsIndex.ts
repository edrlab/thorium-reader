// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnnotationTagsIndex } from "readium-desktop/common/redux/states/renderer/annotation";
import { type Reducer } from "redux";
import { readerActions } from "readium-desktop/common/redux/actions";
import { popTags, pushTags, updateTags } from "../../tags";

function annotationTagsIndexReducer_(
    state: TAnnotationTagsIndex = {},
    action: readerActions.annotation.pop.TAction | readerActions.annotation.push.TAction | readerActions.annotation.update.TAction,
): TAnnotationTagsIndex {


    switch (action.type) {
        case readerActions.annotation.pop.ID: {

            const { tags } = action.payload;
            return popTags(state, tags);
        }

        case readerActions.annotation.push.ID: {

            const { tags } = action.payload;
            return pushTags(state, tags);
        }

        case readerActions.annotation.update.ID: {

            const [oldAnnot, newAnnot] = action.payload;
            return updateTags(state, oldAnnot.tags, newAnnot.tags);
        }


        default:
            return state;
    }
}

export const annotationTagsIndexReducer = annotationTagsIndexReducer_ as Reducer<ReturnType<typeof annotationTagsIndexReducer_>>;
