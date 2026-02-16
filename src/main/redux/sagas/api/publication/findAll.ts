// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { call as callTyped } from "typed-redux-saga/macro";
import { diMainGet } from "readium-desktop/main/di";
import { aboutFiltered } from "readium-desktop/main/tools/filter";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

const filename_ = "readium-desktop:main:redux:sagas:api:publication:findAll";
const debug = debug_(filename_);

const convertDocs = async (docs: PublicationDocument[], publicationViewConverter: PublicationViewConverter) => {
    const pubs = [];
    for (const doc of docs) {
        try {
            const pub = await publicationViewConverter.convertDocumentToView(doc);
            pubs.push(pub);
        } catch (e) {

            debug("Error When convert document to view, the publication is not deleted, so let's mitigate the publication error for the next time");
            debug(e);

            const pub = await publicationViewConverter.convertDocumentMissingOrDeletedToMinimalPublicationView(doc);
            pubs.push(pub);

            // yield* callTyped(errorDeletePub, doc, e as Error);
        }
    }
    return pubs;
};
export function* findAll() {

    const docs = yield* callTyped(() => diMainGet("publication-repository").findAll());
    const publicationViewConverter = yield* callTyped(() => diMainGet("publication-view-converter"));
    const publicationViews = yield* callTyped(() => convertDocs(docs, publicationViewConverter));
    return aboutFiltered(publicationViews);
}
