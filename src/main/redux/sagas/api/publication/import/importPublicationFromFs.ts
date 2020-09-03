// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TaJsonSerialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";
import {
    PublicationParsePromise,
} from "r2-shared-js/dist/es6-es2015/src/parser/publication-parser";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
import { extractCrc32OnZip } from "readium-desktop/main/crc";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { v4 as uuidv4 } from "uuid";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/import/publicationFromFs");

export async function importPublicationFromFS(
    filePath: string,
    hash?: string,
    lcpHashedPassphrase?: string,
): Promise<PublicationDocument> {

    const r2Publication = await PublicationParsePromise(filePath);
    // after PublicationParsePromise, cleanup zip handler
    // (no need to fetch ZIP data beyond this point)
    r2Publication.freeDestroy();

    const r2PublicationJson = TaJsonSerialize(r2Publication);
    const r2PublicationStr = JSON.stringify(r2PublicationJson);
    const r2PublicationBase64 = Buffer.from(r2PublicationStr).toString("base64");

    const lcpManager = diMainGet("lcp-manager");
    const publicationRepository = diMainGet("publication-repository");
    const publicationStorage = diMainGet("publication-storage");

    const pubDocument: PublicationDocumentWithoutTimestampable = {
        identifier: uuidv4(),
        resources: {
            r2PublicationBase64,
            r2LCPBase64: null, // updated below via lcpManager.updateDocumentLcpLsdBase64Resources()
            r2LSDBase64: null, // may be updated via lcpManager.processStatusDocument()
            r2OpdsPublicationBase64: null, // remains null as publication not originate from OPDS
        },
        title: convertMultiLangStringToString(r2Publication.Metadata.Title),
        tags: [],
        files: [],
        coverFile: null,
        customCover: null,
        hash: hash ? hash : await extractCrc32OnZip(filePath),

        lcp: null, // updated below via lcpManager.updateDocumentLcpLsdBase64Resources()
        lcpRightsCopies: 0,
    };
    lcpManager.updateDocumentLcpLsdBase64Resources(pubDocument, r2Publication.LCP);

    debug(`publication document ID=${pubDocument.identifier} HASH=${pubDocument.hash}`);

    // Store publication on filesystem
    debug("[START] Store publication on filesystem", filePath);
    const files = await publicationStorage.storePublication(
        pubDocument.identifier, filePath,
    );
    debug("[END] Store publication on filesystem - END", filePath);

    // Add extracted files to document

    for (const file of files) {
        if (file.contentType.startsWith("image")) {
            pubDocument.coverFile = file;
        } else {
            pubDocument.files.push(file);
        }
    }

    if (pubDocument.coverFile === null) {
        debug("No cover found, generate custom one", filePath);
        // No cover file found
        // Generate a random custom cover
        pubDocument.customCover = RandomCustomCovers[
            Math.floor(Math.random() * RandomCustomCovers.length)
        ];
    }

    if (r2Publication.LCP) {
        try {
            await lcpManager.processStatusDocument(
                pubDocument.identifier,
                r2Publication,
            );

            debug(r2Publication.LCP);
            debug(r2Publication.LCP.LSD);

            lcpManager.updateDocumentLcpLsdBase64Resources(pubDocument, r2Publication.LCP);
        } catch (err) {
            debug(err);
        }

        if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
            debug("processStatusDocument LCP updated.");
            pubDocument.hash = await extractCrc32OnZip(filePath);
        }
    }

    debug("[START] Store publication in database", filePath);
    const newPubDocument = await publicationRepository.save(pubDocument);
    debug("[END] Store publication in database", filePath);

    if (lcpHashedPassphrase) {
        const lcpSecretRepository = diMainGet("lcp-secret-repository");
        const lcpSecretDocs = await lcpSecretRepository.findByPublicationIdentifier(
            newPubDocument.identifier,
        );
        const secrets = lcpSecretDocs.map((doc) => doc.secret).filter((secret) => secret);

        if (!secrets || !secrets.includes(lcpHashedPassphrase)) {
            await lcpSecretRepository.save({
                publicationIdentifier: newPubDocument.identifier,
                secret: lcpHashedPassphrase,
            });
        }
    }

    debug("Publication imported", filePath);
    return newPubDocument;
}
