// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { call as callTyped, delay as delayTyped } from "typed-redux-saga/macro";
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

            // TODO: Optimize publication view conversion during imports.
            //
            // Current behavior:
            // - Each new publication import triggers a full reload of all converted publication views.
            // - During batch imports, this repeats until the entire catalog is processed (no memoization).
            // - After every import, the full catalog is rebuilt and sent to the libraryWindow.
            //
            // Impact:
            // - Significant performance overhead during batch imports.
            // - Repeated disk I/O (reading locators, scanning directories for publication paths).
            // - Unnecessary recomputation and redundant UI updates.
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

    const dummyPubDocArray: PublicationDocument[] = [];

    const docs = yield* callTyped(() => diMainGet("publication-repository").findAll());
    const publicationIdentifierDataBaseArray = docs.map(({ identifier }) => identifier);

    // Not enabled for the 3.4 release
    // Too early to expose potential inconsistencies between disk and database to the user.
    const publicationStorageListPublicationEnabled = false;
    if (publicationStorageListPublicationEnabled) {
        try {
            const publicationIdentifierDiskArray = yield* callTyped(() => diMainGet("publication-storage").listPublicationIdPath());
            yield* delayTyped(1);
            const publicationIdentifierFoundOnDiskButNotFoundOnDataBaseArray: string[] = publicationIdentifierDiskArray.filter((id) => !publicationIdentifierDataBaseArray.includes(id));
            debug("pubId found on disk but not found on DataBase:", JSON.stringify(publicationIdentifierFoundOnDiskButNotFoundOnDataBaseArray));
    
            for (const pubIdNotFoundOnDataBase of publicationIdentifierFoundOnDiskButNotFoundOnDataBaseArray) {
                dummyPubDocArray.push({
                    createdAt: (new Date()).getTime(),
                    updatedAt: (new Date()).getTime(),
                    identifier: pubIdNotFoundOnDataBase,
                    hash: "",
                    title: pubIdNotFoundOnDataBase,
                    doNotPresentInReduxStoreDataBaseButFoundOnDisk_dummyDocument: true,
                });
            }
            if (dummyPubDocArray.length) {
                debug(`Be careful there are ${dummyPubDocArray.length} folder(s) found in publication storage directory and not matched with the DataBase !!!`);
                for (const p of dummyPubDocArray) {
                    debug(`\t${p.identifier}}`);
                }
                debug("--------");
            }
        } catch (e) {
            debug("Error when trying to list uuid in publication folder directory");
            debug(e);
        }
    } // disabled

    const allDocs = [...docs, ...dummyPubDocArray];

    const publicationViewConverter = yield* callTyped(() => diMainGet("publication-view-converter"));

    yield* delayTyped(1);
    const publicationViews = yield* callTyped(() => convertDocs(allDocs, publicationViewConverter));

    return aboutFiltered(publicationViews);
}
