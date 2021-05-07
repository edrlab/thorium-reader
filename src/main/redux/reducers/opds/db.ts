// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { clone } from "ramda";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { opdsActions } from "readium-desktop/main/redux/actions";

const debug = debug_("readium-desktop:main:redux:reducers:opds:db");

const initialState: OpdsFeedDocument[] = [];

export function opdsDbReducers(
    state: OpdsFeedDocument[] = initialState,
    action: opdsActions.addOpdsFeed.TAction
        | opdsActions.deleteOpdsFeed.TAction,
): OpdsFeedDocument[] {
    switch (action.type) {

        case opdsActions.addOpdsFeed.ID: {

            const newState = clone(state);
            for (const doc of action.payload) {
                debug("opdsActions.addOpdsFeed: ", doc, state);

                const newDoc = clone(doc);
                newDoc.doNotMigrateAnymore = true;
                newState.push(newDoc);
            }
            return newState;
        }

        case opdsActions.deleteOpdsFeed.ID: {

            const identifier = action.payload.identifier;
            const idx = state.findIndex((v) => v.identifier === identifier);
            const newState = clone(state);

            debug("opdsActions.deleteOpdsFeed: ", identifier, idx, newState[idx]);

            if (newState[idx]) {
                newState[idx].removedButPreservedToAvoidReMigration = true;
            }
            return newState;
        }

        default:
            // nothing
    }
    return state;
}
