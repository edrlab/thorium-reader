// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import nodeFetch from "node-fetch";

import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";
import { SagaGenerator } from "typed-redux-saga";
import { delay as delayTyped, call as callTyped, race as raceTyped } from "typed-redux-saga/macro";

import { downloader } from "../../../downloader";
import { packageFromLink } from "../packager/packageLink";
import { importFromFsService } from "./importFromFs";
import isURL from "validator/lib/isURL";
import path from "path";
import { app } from "electron";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";
import { nanoid } from "nanoid";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";
import * as fs from "fs";

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
        a: delayTyped(30000),
        b: callTyped(importFromFsService, downloadPath, lcpHashedPassphrase),
    });

    if (link.localBookshelfPublicationId) {

        // download link already attached to a publication
        // need to double check if the publication still exists
        // What to do if a publication is attached !?
        // - We can invalidate the publicationId associated with this downloadLink/opdsPublication
        // - Just ignore it

        const publicationRepository  = diMainGet("publication-repository");
        const publicationAttachedToLocalBookshelfPubId = yield* callTyped(() => publicationRepository.findByPublicationIdentifier(link.localBookshelfPublicationId));

        if (publicationAttachedToLocalBookshelfPubId) {

            debug("publication found");
            debug(publicationAttachedToLocalBookshelfPubId.opdsPublicationStringified);
            debug(pub?.opdsPublicationStringified);
            debug(publicationAttachedToLocalBookshelfPubId.opdsPublicationStringified === pub?.opdsPublicationStringified);
        }
    }

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
                opdsPublicationStringified: pub?.opdsPublicationStringified,
                opdsPublication: { url: link.url, type: link.type, selfLinkUrl: pub?.selfLink?.url, identifier: pub?.workIdentifier },
            },
        );

        const publicationRepository = diMainGet("publication-repository");
        returnPublicationDocument = yield* callTyped(() => publicationRepository.save(publicationDocumentAssigned));

    } else if (alreadyImported && publicationDocument) {

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
                opdsPublicationStringified: pub?.opdsPublicationStringified,
                opdsPublication: { url: link.url, type: link.type, selfLinkUrl: pub?.selfLink?.url, identifier: pub?.workIdentifier },
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
        const hrefUrl = url.toString();
        try {
            // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
            if (!hrefUrl || !isURL(hrefUrl)) {
                debug("isURL() NOK", hrefUrl);
                link.type = "";
            } else {
                // TODO: only HEAD request?? otherwise full body download (time consuming, wasted resources as real download is queued further down here!)
                const response = yield* callTyped(() => nodeFetch(hrefUrl)); // {method:"HEAD"}
                const contentType = response?.headers?.get("Content-Type");
                if (contentType) {
                    link.type = contentType;
                } else {
                    link.type = "";
                }
            }
        } catch (_e) {
            debug("can't fetch url to determine the type", hrefUrl);
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
    const isLcpPdf = contentTypeArray.includes(ContentType.lcppdf);
    const isJson = contentTypeArray.includes(ContentType.Json)
        || contentTypeArray.includes(ContentType.AudioBook)
        || contentTypeArray.includes(ContentType.JsonLd)
        || contentTypeArray.includes(ContentType.Divina)
        || contentTypeArray.includes(ContentType.webpub);
    
    const isCustomizationProfilePublication = /^thoriumhttps:\/\//.test(link.url); // THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL

    debug(contentTypeArray, isHtml, isJson);

    if (!isLcpFile && !isEpubFile && !isAudioBookPacked && !isAudioBookPackedLcp && !isDivinaPacked && !isPdf && !isLcpPdf) {
        debug(`OPDS download link is not EPUB or AudioBook or Divina or Pdf ! ${link.url} ${link.type}`);
    }

    if (isHtml || isJson) {
        link = { url: url.toString() };
    }

    const downloadMayBePackageLink = function*(): SagaGenerator<string> {

        if (isHtml || isJson) {
            debug("the link need to be packaged");

            return yield* callTyped(packageFromLink, url.toString(), isHtml);

        } else if (isCustomizationProfilePublication) {   
            const _contentType = parseContentType(link.type);
            const downloadPath = path.join(app.getPath("temp"), `${nanoid(5)}.${findExtWithMimeType(_contentType)}`);

            const _url = link.url; // thoriumhttps://profileId/pathInZip

            const u = new URL(_url);

            // https://github.com/readium/r2-streamer-js/commit/e214b7e1f8133a8400baec3c6f2d7c8204da01ad
            // At this point, route relative path is already normalised with respect to /../ and /./ dot segments,
            // but not double slashes (which seems to be an easy mistake to make at authoring time in EPUBs),
            // so we collapse multiple slashes into a single one.
            let uPathname = u.pathname;
            if (uPathname) {
                uPathname = uPathname.replace(/\/\/+/g, "/");
                try {
                    uPathname = decodeURIComponent(uPathname);
                } catch (e) {
                    debug("u.pathname decodeURIComponent!?");
                    debug(e);
                }
            }

            const customProfileZipAssetsPrefix = "/custom-profile-zip/";
            const isCustomProfileZipAssets = uPathname.startsWith(customProfileZipAssetsPrefix);
            if (!isCustomProfileZipAssets) {
                throw new Error("ERROR: COPY PUBLICATION IN PROFILE: not a custom-profile-zip url : " + uPathname);
                // return ;
            }

            const route = uPathname.substr(customProfileZipAssetsPrefix.length);
            const [idEncoded, pathInZipEncoded] = route.split(/\/(.*)/s);
            const id = Buffer.from(decodeURIComponent(idEncoded), "base64").toString();
            const pathInZip = path.resolve("/", Buffer.from(decodeURIComponent(pathInZipEncoded), "base64").toString()).substr(1); // remove first '/'

            const state = diMainGet("store").getState();
            const profile = state.customization.provision.find((profile) => profile.id === id);
            const packageProfileFilename = profile.fileName;
            
            const packageAbsolutePath = path.join(customizationWellKnownFolder, packageProfileFilename);


            const zip = yield* callTyped(() => tryCatch(() => zipLoadPromise(packageAbsolutePath), ""));
            if (!zip) {
                throw new Error("ERROR: COPY PUBLICATION IN PROFILE: Not a ZIP package");
            }

            if (!zip.hasEntries()) {
                // throw new Error("LPF zip empty");
                throw new Error("ERROR: COPY PUBLICATION IN PROFILE: Zip has no entries");
            }

            if (!zip.hasEntry(pathInZip)) {
                throw new Error(`ERROR: COPY PUBLICATION IN PROFILE: ${pathInZip} not found`);
            }

            const manifestStream = yield* callTyped(() => zip.entryStreamPromise(pathInZip));

            yield* callTyped(() => new Promise<void>((resolve, reject) => {

                const writeStream = fs.createWriteStream(downloadPath);
    
                writeStream.on("end", () => {
                    debug("createWebpubZip writeStream END", downloadPath);
                });
                writeStream.on("finish", () => {
                    debug("createWebpubZip writeStream FINISH", downloadPath);
                });
                writeStream.on("close", () => {
                    debug("createWebpubZip writeStream CLOSE", downloadPath);
    
                    resolve();
                });
                writeStream.on("error", (err) => {
                    debug("createWebpubZip writeStream ERROR", downloadPath, err);
    
                    reject(err);
                });
    
                manifestStream.stream.on("end", () => {
                    debug("createWebpubZip manifestStream.stream END", downloadPath);
                });
                manifestStream.stream.on("finish", () => {
                    debug("createWebpubZip manifestStream.stream FINISH", downloadPath);
                });
                manifestStream.stream.on("close", () => {
                    debug("createWebpubZip manifestStream.stream CLOSE", downloadPath);
                });
                manifestStream.stream.on("error", (err) => {
                    debug("createWebpubZip manifestStream.stream ERROR", downloadPath, err);
                });
    
                manifestStream.stream.pipe(writeStream);
            }));


            return downloadPath;
        }else {
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
