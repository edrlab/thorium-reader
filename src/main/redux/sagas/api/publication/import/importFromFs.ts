// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import { isAcceptedExtension } from "readium-desktop/common/extension";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { extractCrc32OnZip } from "readium-desktop/main/crc";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { pdfPackager } from "readium-desktop/main/pdf/packager";
import { lpfToAudiobookConverter } from "readium-desktop/main/w3c/lpf/toAudiobook";
import { call, put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";

import { importLcplFromFS } from "./importLcplFromFs";
import { importPublicationFromFS } from "./importPublicationFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromFSService");

export function* importFromFsService(
    filePath: string,
    lcpHashedPassphrase?: string,
): SagaGenerator<PublicationDocument> {

    debug("importFromFsService", filePath);

    const publicationRepository = diMainGet("publication-repository");
    const translate = diMainGet("translator").translate;

    const ext = path.extname(filePath);
    const isLCPLicense = isAcceptedExtension("lcpLicence", ext); // || (ext === ".part" && isLcpFile);
    const isLPF = isAcceptedExtension("w3cAudiobook", ext);
    const isPDF = isAcceptedExtension("pdf", ext);

    debug("extension", ext);
    debug("lcp/lpf/pdf", isLCPLicense, isLPF, isPDF);
    debug(typeof ReadableStream === "undefined" || typeof Promise.allSettled === "undefined");

    try {

        const hash =
            isLCPLicense || isPDF
            ? undefined
                : yield* callTyped(() => extractCrc32OnZip(filePath));
        let [publicationDocument] = hash
            ? yield* callTyped(() => publicationRepository.findByHashId(hash))
            : [];

        if (publicationDocument) {

            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate(
                        "message.import.alreadyImport", { title: publicationDocument.title },
                    ),
                ),
            );

        } else {

            if (isLCPLicense) {

                debug("is a LCP licence need a importer");
                publicationDocument = yield* callTyped(importLcplFromFS, filePath, lcpHashedPassphrase);

            } else {
                let publicationFilePath = filePath;
                let cleanFct: () => void;

                if (isLPF) {

                    debug("is a LPF file need a converter");
                    // convert .lpf to .audiobook
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

            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate(
                        "message.import.success", { title: publicationDocument?.title },
                    ),
                ),
            );
        }

        return publicationDocument;

    } catch (error) {

        debug("importFromFs (hash + import) fail with :" + filePath, error);
        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                translate(
                    "message.import.fail", { path: filePath },
                ),
            ),
        );
    }

    return undefined;
}
