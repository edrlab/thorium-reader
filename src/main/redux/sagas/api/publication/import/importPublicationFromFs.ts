// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// e__slint-disable-next-line @typescript-eslint/ban-ts-comment
// @__ts-ignore TS1479
import { nanoid } from "nanoid";

import * as path from "path";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { lcpLicenseIsNotWellFormed } from "readium-desktop/common/lcp";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { extractCrc32OnZip } from "readium-desktop/main/tools/crc";
import { buildPublicationFilesDocumentPatch } from "readium-desktop/main/tools/publicationDocument";
import {
    PublicationDocument, PublicationDocumentWithoutTimestampable,
} from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { createTempDir } from "readium-desktop/main/fs/path";
import { extractFileFromZipToBuffer } from "readium-desktop/main/zip/extract";
import { uuidv4 } from "readium-desktop/utils/uuid";

import { LCP } from "@r2-lcp-js/parser/epub/lcp";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { DaisyParsePromise } from "@r2-shared-js/parser/daisy";
import { convertDaisyToReadiumWebPub } from "@r2-shared-js/parser/daisy-convert-to-epub";
import { EpubParsePromise } from "@r2-shared-js/parser/epub";
import { acceptedExtensionArray } from "readium-desktop/common/extension";
import { getTranslator } from "readium-desktop/common/services/translator";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/import/publicationFromFs");

export async function importPublicationFromFS(
    filePath: string,
    willBeImmediatelyFollowedByOpen: boolean,
    hash?: string,
    lcpHashedPassphrase?: string,
    preservedIdentifier?: string,
): Promise<PublicationDocument> {

    debug("importPublicationFromFS", filePath);

    // const r2Publication = await PublicationParsePromise(filePath);
    let r2Publication: R2Publication;

    let { ext } = path.parse(filePath);
    ext = ext.toLowerCase();
    if (filePath.replace(/\\/g, "/").toLowerCase().endsWith("/" + acceptedExtensionObject.nccHtml)) {
        ext = acceptedExtensionObject.nccHtml;
    }
    switch (ext) {

        case acceptedExtensionObject.epub:
        case acceptedExtensionObject.epub3:
        case acceptedExtensionObject.pnld:

            debug("epub extension", ext);

            r2Publication = await EpubParsePromise(filePath);

            // after PublicationParsePromise, cleanup zip handler
            // (no need to fetch ZIP data beyond this point)
            r2Publication.freeDestroy();

            break;

        // eslint-disable-next-line no-fallthrough
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        case acceptedExtensionObject.opf:
        // eslint-disable-next-line no-fallthrough
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        case acceptedExtensionObject.nccHtml:
            // DaisyParsePromise allows fake zip to filesystem folder
            filePath = path.dirname(filePath);
            /* falls through */
        case acceptedExtensionObject.daisy:
        case acceptedExtensionObject.zip:

            debug("daisy extension: ", ext, filePath);

            r2Publication = await DaisyParsePromise(filePath);

            const outputDirPath = await createTempDir(nanoid(8), "misc");
            let packagePath = await convertDaisyToReadiumWebPub(outputDirPath, r2Publication, undefined);

            const isFullTextAudio = r2Publication.Metadata?.AdditionalJSON &&
                // dtb:multimediaContent ==> audio,text
                (r2Publication.Metadata.AdditionalJSON["dtb:multimediaType"] === "audioFullText" ||
                r2Publication.Metadata.AdditionalJSON["ncc:multimediaType"] === "audioFullText" || (
                    !r2Publication.Metadata.AdditionalJSON["dtb:multimediaType"] &&
                    !r2Publication.Metadata.AdditionalJSON["ncc:multimediaType"]
                ));
            if (isFullTextAudio && !r2Publication.Spine?.length) {
                debug("%%%%% FAILED audio+text DAISY convert, trying again as audio-only ...");

                // after PublicationParsePromise, cleanup zip handler
                // (no need to fetch ZIP data beyond this point)
                r2Publication.freeDestroy();

                r2Publication = await DaisyParsePromise(filePath);

                // TODO: delete file contents (webpub zip) inside pathFile? shouldn't be necessary as fs.createWriteStream() by default overrides, so does fs.writeFileSync() in the case of generateDaisyAudioManifestOnly
                packagePath = await new Promise((reso) => {
                    setTimeout(async () => {
                        reso(await convertDaisyToReadiumWebPub(outputDirPath, r2Publication, undefined, true));
                    }, 500);
                });
            }

            if (packagePath) {
                return await importPublicationFromFS(packagePath, willBeImmediatelyFollowedByOpen, hash, lcpHashedPassphrase);
            }

            throw new Error("convertDaisyToReadiumWebPub failed?!");
            // break;

        // case acceptedExtensionObject.cbz:
            // r2Publication = await CbzParsePromise(filePath);
            // break;

        case acceptedExtensionObject.audiobook:
        case acceptedExtensionObject.audiobookLcp:
        case acceptedExtensionObject.audiobookLcpAlt:
        case acceptedExtensionObject.divina:
        case acceptedExtensionObject.webpub:
        case acceptedExtensionObject.pdfLcp:

            debug("extension of type readium publication", ext);

            const r2PublicationBuffer = await extractFileFromZipToBuffer(filePath, "manifest.json");
            if (r2PublicationBuffer) {
                debug("r2Publication found in zip");

                const r2PublicationStr = r2PublicationBuffer.toString("utf-8");
                const r2PublicationJson = JSON.parse(r2PublicationStr);
                r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);

                // https://github.com/readium/r2-shared-js/blob/1aa1a1c10fe56ccb99ef0ed2c15a198c46600e7a/src/parser/divina.ts#L137
                r2Publication.AddToInternal("type", ext.slice(1));

                // lcp licence extraction

                const lcpEntryName = "license.lcpl";
                const r2LCPBuffer = await extractFileFromZipToBuffer(filePath, lcpEntryName);
                if (r2LCPBuffer) {
                    debug("lcp licence found in zip");

                    const r2LCPStr = r2LCPBuffer.toString("utf-8");
                    const r2LCPJson = JSON.parse(r2LCPStr);

                    if (lcpLicenseIsNotWellFormed(r2LCPJson)) {
                        throw new Error(`LCP license malformed: ${JSON.stringify(r2LCPJson)}`);
                    }

                    const r2LCP = TaJsonDeserialize(r2LCPJson, LCP);

                    r2LCP.ZipPath = lcpEntryName;
                    r2LCP.JsonSource = r2LCPStr;
                    r2LCP.init();

                    r2Publication.LCP = r2LCP;
                }
            }

            break;

        default:
            debug("extension not recognized", ext);
            throw new Error(getTranslator().translate("dialog.importError", {
                acceptedExtension: `[${ext}] ${acceptedExtensionArray.join(" ")}`,
            }));
    }

    if (!r2Publication) {
        throw new Error("publication manifest not defined");
    }

    // const r2PublicationJson = TaJsonSerialize(r2Publication);
    // Legacy Base64 data blobs
    // const r2PublicationStr = JSON.stringify(r2PublicationJson);
    // const r2PublicationBase64 = Buffer.from(r2PublicationStr).toString("base64");

    const lcpManager = diMainGet("lcp-manager");
    const publicationRepository = diMainGet("publication-repository");
    const publicationStorage = diMainGet("publication-storage");
    const publicationViewConverter = diMainGet("publication-view-converter");
    const store = diMainGet("store");
    const locale = store.getState().i18n.locale;

    const pubDocument: PublicationDocumentWithoutTimestampable = {
        identifier: preservedIdentifier || uuidv4(),
        // resources: {
        //     // Legacy Base64 data blobs

        //     r2PublicationJson,

        //     // updated below via lcpManager.updateDocumentLcp()
        //     // r2LCPJson: null,

        //     // may be updated via lcpManager.processStatusDocument()
        //     // r2LSDJson: null,

        //     // remains null as publication not originate from OPDS
        //     // r2OpdsPublicationJson: null,
        // },

        // see documentTitle vs. publicationTitle (and publicationSubTitle) in PublicationView
        // (and IOpdsPublicationView too, due to polymorphic NormalOrOpdsPublicationView / publicationViewMaybeOpds)
        title: convertMultiLangStringToString(r2Publication.Metadata.Title, locale) || "-", // some publications do not have a title :( ... we patch here, but in previous versions of Thorium this was not done so we must still check for possible empty title edge-cases in previously-created database entries (we do not change the DB on load+save, we just normalise erroneous values at consumption time)

        tags: [],
        files: [],
        hash: hash ? hash : await extractCrc32OnZip(filePath),

        lcpRightsCopies: 0,
        lcpRightsPrints: [],
    };

    debug(`publication document ID=${pubDocument.identifier} HASH=${pubDocument.hash}`);

    // Store publication on filesystem
    const sourceExtension = path.extname(filePath);
    const storableExtension = publicationStorage.getStorablePublicationExtension(sourceExtension);
    debug("[START] Store publication on filesystem", filePath, {
        sourceExtension,
        storableExtension,
        isStorableExtension: publicationStorage.isStorablePublicationExtension(sourceExtension),
    });
    const files = preservedIdentifier ?
        await publicationStorage.getStoredPublicationFiles(pubDocument.identifier) :
        await publicationStorage.storePublication(
            pubDocument.identifier, filePath,
        );
    debug("[END] Store publication on filesystem - END", filePath);

    const filesPatch = buildPublicationFilesDocumentPatch(files);
    pubDocument.files = filesPatch.files;
    pubDocument.coverFile = filesPatch.coverFile;
    pubDocument.customCover = filesPatch.customCover;
    // MUST BE AFTER storePublication() and pubDocument.files.push(file) so that the filesystem cache can be set
    await publicationViewConverter.updatePublicationCache(pubDocument, r2Publication);

    // see below checkPublicationLicenseUpdate
    // if (r2Publication.LCP) {
    //     // MUST BE AFTER storePublication() and pubDocument.files.push(file) so that the filesystem cache can be set
    //     // note: normally calls updateLcpCache(), but skip as updatePublicationCache() above did this already (avoid unnecessary filesystem writes)
    //     lcpManager.updateDocumentLcp(pubDocument, r2Publication.LCP, true);

    //     try {
    //         await lcpManager.processStatusDocument(
    //             pubDocument.identifier,
    //             r2Publication,
    //         );

    //         debug(r2Publication.LCP);
    //         debug(r2Publication.LCP.LSD);

    //         lcpManager.updateDocumentLcp(pubDocument, r2Publication.LCP);
    //     } catch (err) {
    //         debug(err);
    //     }

    //     if ((r2Publication as any).__LCP_LSD_UPDATE_COUNT) {
    //         debug("processStatusDocument LCP updated.");
    //         pubDocument.hash = await extractCrc32OnZip(filePath);
    //     }
    // }

    debug("[START] Store publication in database", filePath);
    const newPubDocument = await publicationRepository.save(pubDocument);
    debug("[END] Store publication in database", filePath);

    // at this point, newPubDocument.lcp is undefined even if r2Publication.LCP
    // passphrase saved for doc.id without provider
    if (lcpHashedPassphrase) {
        await lcpManager.saveSecret(newPubDocument, lcpHashedPassphrase);
    }

    if (r2Publication.LCP) {

        // DOES NOT MUTATE newPubDocument (returns a modified copy)
        const updatedDoc = await lcpManager.checkPublicationLicenseUpdate(newPubDocument, true); // SKIPS the network LSD checks!
        // passphrase saved for doc.id with provider, this time (overrides old entry mapped on doc.id)
        if (updatedDoc && lcpHashedPassphrase) {
            await lcpManager.saveSecret(updatedDoc, lcpHashedPassphrase);
        }

        if (!willBeImmediatelyFollowedByOpen) {
            // deferred firing of the network LSD checks,
            // the file lock will ensure that even if the publication is immediately opened (e.g. double-click from filesystem),
            // there will not be concurrent access race (the publication open itself checks LSD updates, so this one will be skipped during the critical section lock)
            // if there are opened readers when there is an LCP update, the LCPL gets injected into EPUB META-INF/ so the readers are force-closed
            setTimeout(async () => {

                try {
                    debug("deferred lcpManager.checkPublicationLicenseUpdate() after publication import");
                    const publicationDocument = await publicationRepository.get(newPubDocument.identifier);
                    if (!publicationDocument) {
                        debug("skip deferred lcpManager.checkPublicationLicenseUpdate(), publication no longer exists", newPubDocument.identifier);
                        return;
                    }

                    // DOES NOT MUTATE publicationDocument (returns a modified copy)
                    const updatedDoc = await lcpManager.checkPublicationLicenseUpdate(publicationDocument, false);// DOES NOT SKIP the network LSD checks!
                    // passphrase saved for doc.id with provider, this time (overrides old entry mapped on doc.id)
                    if (updatedDoc && lcpHashedPassphrase) {
                        await lcpManager.saveSecret(updatedDoc, lcpHashedPassphrase);
                    }
                } catch (e) {
                    debug("deferred lcpManager.checkPublicationLicenseUpdate() failed", newPubDocument.identifier, e);
                }

            }, 300);
        }
    }

    // at this point, newPubDocument.lcp is defined if r2Publication.LCP
    debug("Publication imported", filePath);
    return newPubDocument;
}
