// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { publicationActions } from "readium-desktop/main/redux/actions";

const initialState: PublicationDocument[] = [];

export function publicationDbReducers(
    state: PublicationDocument[] = initialState,
    action: publicationActions.addPublication.TAction
        | publicationActions.deletePublication.TAction,
): PublicationDocument[] {
    switch (action.type) {

        case publicationActions.addPublication.ID: {

            let newState = state;
            for (const pub of action.payload) {

                const { identifier } = pub;
                const idx = newState.findIndex((v) => v.identifier === identifier);

                const newPub = clone(pub);
                newPub.doNotMigrateAnymore = true;

                if (newState[idx]) {
                    newState = [
                        ...newState.slice(0, idx),
                        ...[
                            newPub,
                        ],
                        ...newState.slice(idx + 1),
                    ];
                } else {
                    newState = [
                        ...newState,
                        ...[
                            newPub,
                        ],
                    ];
                }
            }
            return newState;
        }

        case publicationActions.deletePublication.ID: {

            const identifier = action.payload.publicationIdentifier;
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
