// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { call as callTyped } from "typed-redux-saga/macro";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { aboutFiltered } from "readium-desktop/main/filter";
import { SagaGenerator } from "typed-redux-saga";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

const convertDocs = async (docs: PublicationDocument[], publicationViewConverter: PublicationViewConverter) => {
    const pubs = [];
    for (const doc of docs) {
        pubs.push(await publicationViewConverter.convertDocumentToView(doc));
    }
    return pubs;
};

export function* search(title: string): SagaGenerator<PublicationView[]> {
    const titleFormated = title?.trim() || "";

    const publicationRepository = diMainGet("publication-repository");
    const publicationDocuments = yield* callTyped(() => publicationRepository.searchByTitle(titleFormated));

    const publicationViewConverter = diMainGet("publication-view-converter");

    const publicationViews = yield* callTyped(() => convertDocs(publicationDocuments, publicationViewConverter));

    return aboutFiltered(publicationViews);
}

export function* searchEqTitle(title: string): SagaGenerator<PublicationView[]> {
    const titleFormated = title?.trim() || "";

    const publicationRepository = diMainGet("publication-repository");
    const publicationDocuments = yield* callTyped(() => publicationRepository.findByTitle(titleFormated));

    const publicationViewConverter = diMainGet("publication-view-converter");

    const publicationViews = yield* callTyped(() => convertDocs(publicationDocuments, publicationViewConverter));

    return publicationViews;
}
