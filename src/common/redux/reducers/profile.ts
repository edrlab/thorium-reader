// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { profileActions } from "../actions";
import { IProfile } from "../states/profile";

const initialState = {
    id: 0,
    version: 1,
    name: "Thorium",
    apiapp: true,
};

function profileReducer_(
    state: IProfile = initialState,
    action: profileActions.setProfile.TAction,
): IProfile {
    switch (action.type) {
        case profileActions.setProfile.ID:
            return action.payload.profile;
        default:
            return state;
    }
}

export const profileReducer = profileReducer_ as Reducer<ReturnType<typeof profileReducer_>>;
