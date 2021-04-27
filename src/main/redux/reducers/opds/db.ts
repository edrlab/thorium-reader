// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { opdsActions } from "readium-desktop/main/redux/actions";

const initialState: OpdsFeedDocument[] = [];

export function opdsDbReducers(
    state: OpdsFeedDocument[] = initialState,
    action: opdsActions.addOpdsFeed.TAction
        | opdsActions.deleteOpdsFeed.TAction,
): OpdsFeedDocument[] {
    switch (action.type) {

        case opdsActions.addOpdsFeed.ID: {

            let newState = state;
            for (const doc of action.payload) {

                const { identifier } = doc;
                const idx = newState.findIndex((v) => v.identifier === identifier);

                const newDoc = clone(doc);
                newDoc.doNotMigrateAnymore = true;

                if (newState[idx]) {
                    newState = [
                        ...newState.slice(0, idx),
                        ...[
                            newDoc,
                        ],
                        ...newState.slice(idx + 1),
                    ];
                } else {
                    newState = [
                        ...newState,
                        ...[
                            newDoc,
                        ],
                    ];
                }
            }
            return newState;
        }

        case opdsActions.deleteOpdsFeed.ID: {

            const identifier = action.payload.identifier;
            const idx = state.findIndex((v) => v.identifier === identifier);

            if (state[idx]) {
                return [
                    ...state.slice(0, idx),
                    ...state.slice(idx + 1),
                ];
            }
            return state;
        }

        default:
            return state;
    }
}
