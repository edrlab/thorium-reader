// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import { isAcceptedExtension } from "readium-desktop/common/extension";
import { computeFileHash, extractCrc32OnZip } from "readium-desktop/main/crc";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { pdfPackager } from "readium-desktop/main/pdf/packager";
import { lpfToAudiobookConverter } from "readium-desktop/main/w3c/lpf/toAudiobook";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped } from "typed-redux-saga/macro";

import { importLcplFromFS } from "./importLcplFromFs";
import { importPublicationFromFS } from "./importPublicationFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromFSService");

export function* importFromFsService(
    filePath: string,
    lcpHashedPassphrase?: string,
): SagaGenerator<[publicationDoc: PublicationDocument, alreadyImported: boolean]> {

    debug("importFromFsService", filePath);

    const publicationRepository = diMainGet("publication-repository");

    const ext = path.extname(filePath);
    const isLCPLicense = isAcceptedExtension("lcpLicence", ext); // || (ext === ".part" && isLcpFile);
    const isLPF = isAcceptedExtension("w3cAudiobook", ext);
    const isPDF = isAcceptedExtension("pdf", ext);
    const isOPF = isAcceptedExtension("opf", ext);

    debug("extension", ext);
    debug("lcp/lpf/pdf", isLCPLicense, isLPF, isPDF);
    // debug(typeof ReadableStream === "undefined" || typeof Promise.allSettled === "undefined");

    const hash =
        isLCPLicense ?
            undefined :
            (isPDF ?
                yield* callTyped(() => computeFileHash(filePath)) :
                (isOPF ? undefined : yield* callTyped(() => extractCrc32OnZip(filePath)))
            );
    const publicationDocumentInRepository = hash
        ? yield* callTyped(() => publicationRepository.findByHashId(hash))
        : undefined;
    if (publicationDocumentInRepository) {
        return [publicationDocumentInRepository, true];
    }

    let publicationDocument: PublicationDocument;
    if (isLCPLicense) {

        debug("is a LCP licence need a converter");
        return yield* callTyped(importLcplFromFS, filePath, lcpHashedPassphrase);

    } else {
        let publicationFilePath = filePath;
        let cleanFct: () => void;

        if (isLPF) {

            debug("is a LPF file need a converter");
            // convert .lpf to .audiobook === .webpub
            [publicationFilePath, cleanFct] = yield* callTyped(() => lpfToAudiobookConverter(filePath));

        } else if (isPDF) {

            debug("is a PDF file need a converter");
            // convert .pdf to .webpub
            publicationFilePath = yield* callTyped(() => pdfPackager(filePath));
        }

        publicationDocument = yield* callTyped(
            () => importPublicationFromFS(publicationFilePath, hash, lcpHashedPassphrase));

        if (cleanFct) {
            yield call(() => cleanFct());
        }
    }

    return [publicationDocument, false];
}
