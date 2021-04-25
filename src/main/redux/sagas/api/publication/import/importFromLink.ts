// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import fetch from "node-fetch";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { ContentType } from "readium-desktop/utils/contentType";
import { delay, SagaGenerator } from "typed-redux-saga";
import { call as callTyped, race as raceTyped } from "typed-redux-saga/macro";

import { downloader } from "../../../downloader";
import { packageFromLink } from "../packager/packageLink";
import { importFromFsService } from "./importFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromLinkService");

function* importLinkFromPath(
    downloadPath: string,
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
): SagaGenerator<[publicationDocument: PublicationDocument, alreadyImported: boolean]> {

    // Import downloaded publication in catalog
    const lcpHashedPassphrase = link?.properties?.lcpHashedPassphrase;

    const { b: [publicationDocument, alreadyImported] } = yield* raceTyped({
        a: delay(30000),
        b: callTyped(importFromFsService, downloadPath, lcpHashedPassphrase),
    });

    let returnPublicationDocument = publicationDocument;
    if (!alreadyImported && publicationDocument) {

        const tags = pub?.tags?.map((v) => v.name) || [];

        // Merge with the original publication
        const publicationDocumentAssigned = Object.assign(
            {},
            publicationDocument,
            {
                // resources: {
                //     r2PublicationJson: publicationDocument.resources.r2PublicationJson,
                //     // r2LCPJson: publicationDocument.resources.r2LCPJson,
                //     // r2LSDJson: publicationDocument.resources.r2LSDJson,
                //     // r2OpdsPublicationJson: pub?.r2OpdsPublicationJson || undefined,

                //     // Legacy Base64 data blobs
                //     //
                //     // r2PublicationBase64: publicationDocument.resources.r2PublicationBase64,
                //     // r2LCPBase64: publicationDocument.resources.r2LCPBase64,
                //     // r2LSDBase64: publicationDocument.resources.r2LSDBase64,
                //     // r2OpdsPublicationBase64: pub?.r2OpdsPublicationBase64 || "",
                // } as Resources,
                tags,
            },
        );

        const publicationRepository = diMainGet("publication-repository");
        returnPublicationDocument = yield* callTyped(() => publicationRepository.save(publicationDocumentAssigned));

    }

    return [returnPublicationDocument, alreadyImported];

}

export function* importFromLinkService(
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
): SagaGenerator<[publicationDocument: PublicationDocument | undefined, alreadyImported: boolean]> {

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
        } catch (_e) {
            debug("can't fetch url to determine the type", url.toString());
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
    const isDivinaPacked = contentTypeArray.includes(ContentType.DivinaPacked);
    const isPdf = contentTypeArray.includes(ContentType.pdf);
    const isJson = contentTypeArray.includes(ContentType.Json)
        || contentTypeArray.includes(ContentType.AudioBook)
        || contentTypeArray.includes(ContentType.JsonLd)
        || contentTypeArray.includes(ContentType.Divina)
        || contentTypeArray.includes(ContentType.webpub)
        || contentTypeArray.includes(ContentType.lcppdf);

    debug(contentTypeArray, isHtml, isJson);

    if (!isLcpFile && !isEpubFile && !isAudioBookPacked && !isAudioBookPackedLcp && !isDivinaPacked && !isPdf) {
        debug(`OPDS download link is not EPUB or AudioBook or Divina or Pdf ! ${link.url} ${link.type}`);
    }

    if (isHtml || isJson) {
        link = { url: url.toString() };
    }

    const downloadMayBePackageLink = function*() {

        if (isHtml || isJson) {
            debug("the link need to be packaged");

            return yield* callTyped(packageFromLink, url.toString(), isHtml);

        } else {
            debug("Start the download", link);

            const [downloadPath] = yield* callTyped(downloader, [{ href: link.url, type: link.type }], title);
            return downloadPath;
        }
    };

    const fileOrPackagePath = yield* callTyped(downloadMayBePackageLink);
    if (fileOrPackagePath) {
        return yield* callTyped(importLinkFromPath, fileOrPackagePath, link, pub);
    } else {
        debug("downloaded file path or package path is empty");
    }

    return [undefined, false];
}
