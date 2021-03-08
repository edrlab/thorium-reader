// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { publicationActions } from "readium-desktop/main/redux/actions";


export function publicationIndexerReducers(
    state: any = null, // hydrated
    action: publicationActions.addPublication.TAction
        | publicationActions.deletePublication.TAction,
): PublicationDocument[] {
    switch (action.type) {

        case publicationActions.addPublication.ID: {

            try {

                for (const doc of action.payload) {

                    const docCloned = {
                        title: doc.title,
                        id: doc.identifier,
                    };

                    state.addDoc(docCloned);
                }
            } catch (_e) {

                // ignore
            }

            return state;
        }

        case publicationActions.deletePublication.ID: {

            try {

                state.removeDoc({
                    id: action.payload.publicationIdentifier,
                });
            } catch (_e) {

                // ignore
            }
            return state;
        }

        default:
            return state;
    }
}
