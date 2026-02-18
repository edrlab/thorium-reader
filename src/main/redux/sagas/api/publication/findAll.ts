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
import * as fs from "node:fs";
import * as path from "node:path";

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

    const publicationDirectoryPath = yield* callTyped(() => diMainGet("publication-storage").getRootPath());
    const files = yield* callTyped(() => fs.promises.readdir(publicationDirectoryPath, { withFileTypes: true }));
    const publicationIdentifierDiskArray: string[] = [];
    for (const file of files) {
        if (
            /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(file.name) &&
            file.isDirectory()
        ) {
            publicationIdentifierDiskArray.push(file.name);
        }
    }

    yield *delayTyped(1);
    const docs = yield* callTyped(() => diMainGet("publication-repository").findAll());
    const publicationIdentifierDataBaseArray = docs.map(({ identifier }) => identifier);

    const publicationIdentifierFoundInDiskButNotFoundOnDataBaseArray: string[] = publicationIdentifierDiskArray.filter((id) => !publicationIdentifierDataBaseArray.includes(id));
    debug("pubId found on disk but not matched with DataBase:", JSON.stringify(publicationIdentifierDataBaseArray));

    const dummyPubDocArray: PublicationDocument[] = [];
    for (const pubIdNotFoundOnDataBase of publicationIdentifierFoundInDiskButNotFoundOnDataBaseArray) {
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
            debug(`\t${p.identifier} -=> ${path.join(publicationDirectoryPath, p.identifier)}`);
        }
        debug("--------");
    }
    const allDocs = [...docs, ...dummyPubDocArray];

    const publicationViewConverter = yield* callTyped(() => diMainGet("publication-view-converter"));

    yield* delayTyped(1);
    const publicationViews = yield* callTyped(() => convertDocs(allDocs, publicationViewConverter));

    return aboutFiltered(publicationViews);
}
