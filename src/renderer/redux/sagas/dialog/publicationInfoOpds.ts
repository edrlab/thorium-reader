// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { TPublication } from "readium-desktop/renderer/type/publication.type";
import { all, call, put } from "redux-saga/effects";

import { apiSaga } from "../api";

const REQUEST_ID = "PUBINFO_OPDS_REQUEST_ID";

function* checkOpdsPublication() {
    // get the publication-info-opds action
    // si tout les champs les plus important sont remplis ??
    // retourner l'effect le redux reducers va chargé les données dans dialog.data
    // sinon chercher une url publication entry
    // si il y'en a une emettre un dispatch vers l'api browsePublication
    // et recuperer les donnée dans une autre fct watcher (cf opds)
    // sinon retourner l'effect mais les données seront inconsistante a l'affichage

    while (1) {
        const action = yield* takeTyped(dialogActions.openRequest.build);

        if (action.payload?.type === "publication-info-opds") {

            const publication = action.payload.data as TPublication;

            // find the entry url even if all data is already load in publication
            if (Array.isArray(publication.entryLinks) && publication.entryLinks[0]) {
                const browseLink = publication.entryLinks[0].url;
                yield* apiSaga("opds/getPublicationFromEntry", REQUEST_ID, browseLink);
            }
        }
    }
}

export function* watchers() {
    yield all([
        call(checkOpdsPublication),
    ]);
}
