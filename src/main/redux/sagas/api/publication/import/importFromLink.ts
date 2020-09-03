// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { ContentType } from "readium-desktop/utils/content-type";
import { SagaGenerator } from "typed-redux-saga";

import { downloader } from "../../../downloader";
import { importFromFsService } from "./importFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromLinkService");

export function* importFromLinkService(
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
): SagaGenerator<PublicationDocument | undefined> {

    let returnPublicationDocument: PublicationDocument;

    if (!link?.url) {
        debug("Unable to get an acquisition url from opds publication", link);
        throw new Error("Unable to get acquisition url from opds publication");
    }

    const title = link.title || link.url;
    const isLcpFile = link.type === ContentType.Lcp;
    const isEpubFile = link.type === ContentType.Epub;
    const isAudioBookPacked = link.type === ContentType.AudioBookPacked;
    const isAudioBookPackedLcp = link.type === ContentType.AudioBookPackedLcp;
    if (!isLcpFile && !isEpubFile && !isAudioBookPacked && !isAudioBookPackedLcp) {
        // throw new Error(`OPDS download link is not EPUB or AudioBook! ${link.url} ${link.type}`);
        debug(`OPDS download link is not EPUB or AudioBook! ${link.url} ${link.type}`);
    }

    debug("Start the download", link);

    const [downloadPath] = yield* callTyped(downloader, [link.url], title);

    if (downloadPath) {

        // Import downloaded publication in catalog
        const lcpHashedPassphrase = link?.properties?.lcpHashedPassphrase;
        let publicationDocument = yield* importFromFsService(downloadPath, lcpHashedPassphrase);

        if (publicationDocument) {
            const tags = pub?.tags?.map((v) => v.name);

            // Merge with the original publication
            publicationDocument = Object.assign(
                {},
                publicationDocument,
                {
                    resources: {
                        r2PublicationBase64: publicationDocument.resources.r2PublicationBase64,
                        r2LCPBase64: publicationDocument.resources.r2LCPBase64,
                        r2LSDBase64: publicationDocument.resources.r2LSDBase64,
                        r2OpdsPublicationBase64: pub?.r2OpdsPublicationBase64 || "",
                    },
                    tags,
                },
            );

            const publicationRepository = diMainGet("publication-repository");
            returnPublicationDocument = yield* callTyped(() => publicationRepository.save(publicationDocument));
        }
    }

    return returnPublicationDocument;
}
