// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { call as callTyped } from "typed-redux-saga/macro";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/get");

const convertDoc = async (doc: PublicationDocument, publicationViewConverter: PublicationViewConverter) => {
    return await publicationViewConverter.convertDocumentToView(doc);
};

export function* getPublication(identifier: string, checkLcpLsd = false) {

    const publicationRepository = diMainGet("publication-repository");

    let doc: PublicationDocument;
    try {
        doc = yield* callTyped(() => publicationRepository.get(identifier));
    } catch (e) {
        debug(`can't get ${identifier}`, e);
        throw new Error("publication not found"); // TODO translation
    }

    const lcpManager = diMainGet("lcp-manager");

    try {
        if (checkLcpLsd && doc.lcp) {
            doc = yield* callTyped(() => lcpManager.checkPublicationLicenseUpdate(doc));
        }
    } catch (e) {
        debug("error on checkPublicationLicenseUpdate", e);
        throw new Error("check lcp license in publication failed"); // TODO translation
    }

    const publicationViewConverter = diMainGet("publication-view-converter");

    try {
        return yield* callTyped(() => convertDoc(doc, publicationViewConverter));
    } catch (e) {
        debug("error on convertDocumentToView", e);

        // tslint:disable-next-line: no-floating-promises
        // this.deletePublication(identifier, e.toString());

        throw new Error(`${doc.title} is corrupted and should be removed`); // TODO translation
    }
}
