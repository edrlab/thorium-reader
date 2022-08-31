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

                // CANNOT DO THIS HERE, see OpdsFeedRepository.save() implementation comments (store.dispatch(feedAction))
                // ensures no duplicates (same URL ... but may be different titles)
                // const found = state.find((v) => v.url === doc.url);
                // if (found) {
                //     continue;
                // }

                const newDoc = clone(doc);
                newDoc.doNotMigrateAnymore = true;
                newState.push(newDoc);
            }
            return newState;
        }

        case opdsActions.deleteOpdsFeed.ID: {

            const identifier = action.payload.identifier;
            const idx = state.findIndex((v) => v.identifier === identifier);

            debug("opdsActions.deleteOpdsFeed: ", identifier, idx, state[idx]);

            if (state[idx]) {
                if (state[idx].migratedFrom1_6Database) {
                    debug("opdsActions.deleteOpdsFeed - migratedFrom1_6Database => removedButPreservedToAvoidReMigration");
                    const newState = clone(state);
                    newState[idx].removedButPreservedToAvoidReMigration = true;
                    return newState;
                } else {
                    debug("opdsActions.deleteOpdsFeed - !migratedFrom1_6Database => DELETE");
                    return [
                        ...state.slice(0, idx),
                        ...state.slice(idx + 1),
                    ];
                }
            }

            // fallback
            return state;
        }

        default:
            // nothing
    }
    return state;
}
