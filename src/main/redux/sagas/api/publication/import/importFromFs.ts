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
import { lpfToAudiobookConverter } from "readium-desktop/main/lpfConverter";
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

    const publicationRepository = diMainGet("publication-repository");
    const translate = diMainGet("translator").translate;

    const ext = path.extname(filePath);
    const isLCPLicense = isAcceptedExtension("lcpLicence", ext); // || (ext === ".part" && isLcpFile);
    const isLPF = isAcceptedExtension("w3cAudiobook", ext);

    try {

        debug("importFromFsService");

        const hash = isLCPLicense ? undefined : yield* callTyped(() => extractCrc32OnZip(filePath));
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
                publicationDocument = yield* importLcplFromFS(filePath, lcpHashedPassphrase);

            } else {
                let epubFilePath = filePath;
                let cleanFct: () => void;

                if (isLPF) {
                    // convert .lpf to .audiobook
                    [epubFilePath, cleanFct] = yield* callTyped(() => lpfToAudiobookConverter(filePath));
                }

                publicationDocument = yield* callTyped(
                    () => importPublicationFromFS(epubFilePath, hash, lcpHashedPassphrase));

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
