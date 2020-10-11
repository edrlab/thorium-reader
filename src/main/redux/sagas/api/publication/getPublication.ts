// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/get");

export function* getPublication(identifier: string, checkLcpLsd: boolean = false) {

    const publicationRepository = diMainGet("publication-repository");

    let doc: PublicationDocument;
    try {
        doc = yield* callTyped(() => publicationRepository.get(identifier));
    } catch (e) {
        debug(`can't get ${identifier}`, e);
        throw new Error(`publication not found`); // TODO translation
    }

    const lcpManager = diMainGet("lcp-manager");

    try {
        if (checkLcpLsd && doc.lcp) {
            doc = yield* callTyped(() => lcpManager.checkPublicationLicenseUpdate(doc));
        }
    } catch (e) {
        debug(`error on checkPublicationLicenseUpdate`, e);
        throw new Error(`check lcp license in publication failed`); // TODO translation
    }

    const publicationViewConverter = diMainGet("publication-view-converter");

    try {
        return publicationViewConverter.convertDocumentToView(doc);
    } catch (e) {
        debug("error on convertDocumentToView", e);

        // tslint:disable-next-line: no-floating-promises
        // this.deletePublication(identifier);

        throw new Error(`${doc.title} is corrupted and should be removed`); // TODO translation
    }
}
