// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { SagaGenerator } from "typed-redux-saga";

export function* search(title: string): SagaGenerator<PublicationView[]> {
    const titleFormated = title?.trim() || "";

    const publicationRepository = diMainGet("publication-repository");
    const publicationDocuments = yield* callTyped(() => publicationRepository.searchByTitle(titleFormated));

    const publicationViewConverter = diMainGet("publication-view-converter");
    const publicationViews = publicationDocuments.map((publicationDocument) =>
        publicationViewConverter.convertDocumentToView(publicationDocument));

    return publicationViews;
}
