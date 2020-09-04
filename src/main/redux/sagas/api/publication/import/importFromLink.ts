// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import fetch from "node-fetch";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { ContentType } from "readium-desktop/utils/content-type";
import { SagaGenerator } from "typed-redux-saga";

import { downloader } from "../../../downloader";
import { packageFromLink } from "../packager/packageLink";
import { importFromFsService } from "./importFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromLinkService");

function* importLinkFromPath(
    downloadPath: string,
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
) {

    let returnPublicationDocument: PublicationDocument;
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

    return returnPublicationDocument;
}

export function* importFromLinkService(
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
): SagaGenerator<PublicationDocument | undefined> {

    let url: URL;
    try {
        url = new URL(link?.url);
    } catch (e) {
        debug("bad url", link, e);
        throw new Error("Unable to get acquisition url from opds publication");
    }

    if (!link.type) {
        try {
            const response = yield* callTyped(() => fetch(url));
            const contentType = response?.headers?.get("Content-Type");
            if (contentType) {
                link.type = contentType;
            } else {
                link.type = "";
            }
        } catch (e) {
            debug("can't fetch url", url.toString());

            link.type = "";
        }
    }
    const contentTypeArray = link.type.replace(/\s/g, "").split(";");

    const title = link.title || link.url;
    const isLcpFile = contentTypeArray.includes(ContentType.Lcp);
    const isEpubFile = contentTypeArray.includes(ContentType.Epub);
    const isAudioBookPacked = contentTypeArray.includes(ContentType.AudioBookPacked);
    const isAudioBookPackedLcp = contentTypeArray.includes(ContentType.AudioBookPackedLcp);
    const isHtml = contentTypeArray.includes(ContentType.Html);
    const isJson = contentTypeArray.includes(ContentType.Json)
        || contentTypeArray.includes(ContentType.AudioBook)
        || contentTypeArray.includes(ContentType.JsonLd);

    if (!isLcpFile && !isEpubFile && !isAudioBookPacked && !isAudioBookPackedLcp) {
        debug(`OPDS download link is not EPUB or AudioBook! ${link.url} ${link.type}`);
    }

    if (isHtml || isJson) {
        debug("the link need to be packaged");

        const packagePath = yield* callTyped(packageFromLink, url.toString(), isHtml);
        if (packagePath) {

            return yield* callTyped(importLinkFromPath, packagePath, { url: url.toString()}, pub);
        } else {
            return undefined;
        }

    } else {
        debug("Start the download", link);

        const [downloadPath] = yield* callTyped(downloader, [link.url], title);
        if (downloadPath) {

            return yield* callTyped(importLinkFromPath, downloadPath, link, pub);
        }

    }

    debug("error to import", url.toString());
    return undefined;
}
