// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { catalogActions } from "readium-desktop/common/redux/actions";

const initialState: string[] = [];

function tagReducer_(
    state: string[] = initialState,
    action: catalogActions.setTagView.TAction,
): string[] {
    switch (action.type) {
        case catalogActions.setTagView.ID:
            const {tags} = action.payload;
            return tags;

        default:
            return state;

    }
}

export const tagReducer = tagReducer_ as Reducer<ReturnType<typeof tagReducer_>>;
