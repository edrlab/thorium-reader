// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { catalogActions } from "readium-desktop/common/redux/actions";

const initialState: {
    defaultDirectory?: string;
    userDirectory?: string;
} = {};

function directoryReducer_(
    state = initialState,
    action: catalogActions.setUserDirectory.TAction,
): typeof initialState {
    switch (action.type) {
        case catalogActions.setUserDirectory.ID:
            const {userDirectory} = action.payload;
            return {
                defaultDirectory: state.defaultDirectory,
                userDirectory,
            };

        default:
            return state;

    }
}

export const directoryReducer = directoryReducer_ as Reducer<ReturnType<typeof directoryReducer_>>;
