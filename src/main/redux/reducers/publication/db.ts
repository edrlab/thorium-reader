// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { clone } from "ramda";
import { publicationActions } from "readium-desktop/main/redux/actions";

import { IDictPublicationState } from "../../states/publication";

const debug = debug_("readium-desktop:main:redux:reducers:publication:db");

const initialState: IDictPublicationState = {};

export function publicationDbReducers(
    state: IDictPublicationState = initialState,
    action: publicationActions.addPublication.TAction
        | publicationActions.deletePublication.TAction,
): IDictPublicationState {
    switch (action.type) {

        case publicationActions.addPublication.ID: {

            const newState = clone(state);
            for (const pub of action.payload) {
                pub.doNotMigrateAnymore = true;
                const id = pub.identifier;
                debug("publicationActions.addPublication: ", pub, newState[id]);
                newState[id] = {
                    ...newState[id], // can be undefined
                    ...pub,
                };
            }
            return newState;
        }

        case publicationActions.deletePublication.ID: {

            const id = action.payload.publicationIdentifier;
            const newState = clone(state);
            debug("publicationActions.deletePublication: ", id, newState[id]);
            newState[id].removedButPreservedToAvoidReMigration = true;
            return newState;
        }

        default:
            // nothing
    }
    return state;
}
