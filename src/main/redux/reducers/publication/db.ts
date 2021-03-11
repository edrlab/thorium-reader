// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";
import { publicationActions } from "readium-desktop/main/redux/actions";
import { IDictPublicationState } from "../../states/publication";

const initialState: IDictPublicationState = {};

export function publicationDbReducers(
    state: IDictPublicationState = initialState,
    action: publicationActions.addPublication.TAction
        | publicationActions.deletePublication.TAction,
): IDictPublicationState {
    switch (action.type) {

        case publicationActions.addPublication.ID: {

            const newState = clone(state);
            for (const payload of action.payload) {

                payload.doNotMigrateAnymore = true;

                const id = payload.identifier;
                newState[id] = {
                    ...newState[id],
                    ...payload,
                };
            }
            return newState;
        }

        case publicationActions.deletePublication.ID: {

            const id = action.payload.publicationIdentifier;

            if (state[id]) {
                const ret = {
                    ...state,
                };
                delete ret[id];
                return ret;
            }
        }
    }
    return state;
}
