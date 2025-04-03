// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { creatorActions } from "../actions";
import { INoteCreator } from "../states/creator";
import { v4 as uuidv4 } from "uuid";

const username = "";
// try {
//     username = process.env.USERNAME || process.env.USER || userInfo().username;
// } catch {
//     // ignore
// }

const uuid = uuidv4();
const initialState: INoteCreator = {
    id: uuid,
    urn: `urn:uuid:${uuid}`,
    type: "Organization",
    name: username,
};

function creatorReducer_(
    state = initialState,
    action: creatorActions.set.TAction,
): INoteCreator {

    switch (action.type) {
        case creatorActions.set.ID:
            return {
                // state: state.state,
                id: action.payload.id,
                urn: action.payload.urn,
                type: action.payload.type,
                name: action.payload.name,
            };
        default:
            return state;
    }
}

export const creatorReducer = creatorReducer_ as Reducer<ReturnType<typeof creatorReducer_>>;
