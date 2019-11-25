// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { all, call } from "redux-saga/effects";

function* checkOpdsPublication() {
    // get the publication-info-opds action
    // si tout les champs les plus important sont remplis ??
    // retourner l'effect le redux reducers va chargé les données dans dialog.data
    // sinon chercher une url publication entry
    // si il y'en a une emettre un dispatch vers l'api browsePublication
    // et recuperer les donnée dans une autre fct watcher (cf opds)
    // sinon retourner l'effect mais les données seront inconsistante a l'affichage
}

export function* watchers() {
    yield all([
        call(checkOpdsPublication),
    ]);
}
