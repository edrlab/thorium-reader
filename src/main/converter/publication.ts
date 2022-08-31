// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
import * as fs from "fs";

import { isAudiobookFn, isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { inject, injectable } from "inversify";
import * as moment from "moment";
import { CoverView, PublicationView } from "readium-desktop/common/views/publication";
import {
    convertContributorArrayToStringArray,
} from "readium-desktop/main/converter/tools/localisation";
import { PublicationDocument, PublicationDocumentWithoutTimestampable } from "readium-desktop/main/db/document/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";

import { diMainGet } from "../di";
import { lcpLicenseIsNotWellFormed } from "readium-desktop/common/lcp";
import { LCP } from "@r2-lcp-js/parser/epub/lcp";

// import { type Store } from "redux";
// import { RootState } from "../redux/states";

const debug = debug_("readium-desktop:main#converter/publication");

// memory cache, to minimize filesystem access
interface ICache {
    r2PublicationStr?: string;
    r2LCPStr?: string;
}
const _pubCache: Record<string, ICache> = {};

@injectable()
export class PublicationViewConverter {

    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    // @inject(diSymbolTable.store)
    // private readonly store!: Store<RootState>;

    public removeFromMemoryCache(identifier: string) {
        if (_pubCache[identifier]) {
            delete _pubCache[identifier];
        }
    }

    public updateLcpCache(publicationDocument: PublicationDocumentWithoutTimestampable, r2LCP: LCP) {

        const pubFolder = this.publicationStorage.buildPublicationPath(
            publicationDocument.identifier,
        );

        debug("====> updateLcpCache: ", pubFolder);
        const lcpPath = path.join(pubFolder, "license.lcpl");

        const r2LCPStr = r2LCP.JsonSource ? r2LCP.JsonSource : JSON.stringify(TaJsonSerialize(r2LCP));

        if (_pubCache[publicationDocument.identifier]?.r2PublicationStr) {
            _pubCache[publicationDocument.identifier].r2LCPStr = r2LCPStr;
        }

        fs.writeFileSync(lcpPath, r2LCPStr, { encoding: "utf-8"});
    }

    public updatePublicationCache(publicationDocument: PublicationDocumentWithoutTimestampable, r2Publication: R2Publication) {
        _pubCache[publicationDocument.identifier] = {};

        const pubFolder = this.publicationStorage.buildPublicationPath(
            publicationDocument.identifier,
        );

        debug("====> updatePublicationCache: ", pubFolder);
        const manifestPath = path.join(pubFolder, "manifest.json");

        const r2PublicationStr = JSON.stringify(TaJsonSerialize(r2Publication), null, 2);

        _pubCache[publicationDocument.identifier].r2PublicationStr = r2PublicationStr;

        fs.writeFileSync(manifestPath, r2PublicationStr, { encoding: "utf-8"});

        if (r2Publication.LCP) {
            this.updateLcpCache(publicationDocument, r2Publication.LCP);
        }
    }

    public async unmarshallR2Publication(
        publicationDocument: PublicationDocument,
    ): Promise<R2Publication> {

        const pubFolder = this.publicationStorage.buildPublicationPath(
            publicationDocument.identifier,
        );

        debug("====> unmarshallR2Publication: ", pubFolder);

        if (_pubCache[publicationDocument.identifier]?.r2PublicationStr) {
            const r2PublicationStr = _pubCache[publicationDocument.identifier].r2PublicationStr;
            debug("====> manifest (memory cache)");
            const r2PublicationJson = JSON.parse(r2PublicationStr);
            const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);

            const r2LCPStr = _pubCache[publicationDocument.identifier]?.r2LCPStr;
            if (r2LCPStr) {
                try {
                    debug("====> LCP (memory cache)");
                    const r2LCPJson = JSON.parse(r2LCPStr);

                    if (!lcpLicenseIsNotWellFormed(r2LCPJson)) {
                        const r2LCP = TaJsonDeserialize(r2LCPJson, LCP);

                        r2LCP.ZipPath = "dummy/license.lcpl";
                        r2LCP.JsonSource = r2LCPStr;
                        r2LCP.init();

                        r2Publication.LCP = r2LCP;
                    } else {
                        debug("NOT WELL FORMED LCP?");
                    }
                } catch (_err) {}
            }

            return r2Publication;
        }

        try {
            const manifestPath = path.join(pubFolder, "manifest.json");
            const r2PublicationStr = fs.readFileSync(manifestPath, { encoding: "utf-8"});
            debug("====> manifest: ", manifestPath);
            const r2PublicationJson = JSON.parse(r2PublicationStr);
            const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);

            try {
                const lcpPath = path.join(pubFolder, "license.lcpl");
                const r2LCPStr = fs.readFileSync(lcpPath, { encoding: "utf-8"});
                debug("====> LCP: ", lcpPath);
                const r2LCPJson = JSON.parse(r2LCPStr);

                if (!lcpLicenseIsNotWellFormed(r2LCPJson)) {
                    const r2LCP = TaJsonDeserialize(r2LCPJson, LCP);

                    r2LCP.ZipPath = "dummy/license.lcpl";
                    r2LCP.JsonSource = r2LCPStr;
                    r2LCP.init();

                    r2Publication.LCP = r2LCP;
                } else {
                    debug("NOT WELL FORMED LCP?");
                }
            } catch (_err) {}

            this.updatePublicationCache(publicationDocument, r2Publication);

            return r2Publication;
        } catch (err) {
            debug(err, " FALLBACK: parsing publication from filesystem ...");

            const epubPath = this.publicationStorage.getPublicationEpubPath(
                publicationDocument.identifier,
            );

            const r2Publication = await PublicationParsePromise(epubPath);
            // just like when calling lsdLcpUpdateInject():
            // r2Publication.LCP.ZipPath is set to META-INF/license.lcpl
            // r2Publication.LCP.init(); is called to prepare for decryption (native NodeJS plugin)
            // r2Publication.LCP.JsonSource is set

            // after PublicationParsePromise, cleanup zip handler
            // (no need to fetch ZIP data beyond this point)
            r2Publication.freeDestroy();

            this.updatePublicationCache(publicationDocument, r2Publication);

            return r2Publication;
        }
    }

    // Note: PublicationDocument and PublicationView are both Identifiable, with identical `identifier`
    public async convertDocumentToView(document: PublicationDocument): Promise<PublicationView> {
        // Legacy Base64 data blobs
        // const r2PublicationBase64 = document.resources.r2PublicationBase64;
        // const r2PublicationStr = Buffer.from(r2PublicationBase64, "base64").toString("utf-8");
        // const r2PublicationJson = JSON.parse(r2PublicationStr);
        // const r2PublicationJson = document.resources.r2PublicationJson;
        // const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);
        const r2Publication = await this.unmarshallR2Publication(document);
        const r2PublicationJson = TaJsonSerialize(r2Publication); // note: does not include r2Publication.LCP

        const publishers = convertContributorArrayToStringArray(
            r2Publication.Metadata.Publisher,
        );
        const authors = convertContributorArrayToStringArray(
            r2Publication.Metadata.Author,
        );

        let publishedAt: string | undefined;
        if (r2Publication.Metadata.PublicationDate) {
            publishedAt = moment(r2Publication.Metadata.PublicationDate).toISOString();
        }

        let modifiedAt: string | undefined;
        if (r2Publication.Metadata.Modified) {
            modifiedAt = moment(r2Publication.Metadata.Modified).toISOString();
        }

        let cover: CoverView | undefined;
        if (document.coverFile) {
            cover = {
                thumbnailUrl : document.coverFile.url,
                coverUrl: document.coverFile.url,
            };
        }

        // TODO become a side effect function : AIE !!
        // could be refactored when the publications documents will be in the state
        const store = diMainGet("store");
        const state = store.getState();
        const readerStateLocator = tryCatchSync(() => state.win.registry.reader[document.identifier]?.reduxState.locator, "");

        const duration = typeof r2Publication.Metadata.Duration === "number" ? r2Publication.Metadata.Duration : undefined;
        const nbOfTracks = typeof r2Publication.Metadata.AdditionalJSON?.tracks === "number" ? r2Publication.Metadata.AdditionalJSON?.tracks : undefined;


        const isAudio = r2Publication.Metadata.RDFType?.toLowerCase().includes("audio") || isAudiobookFn(r2Publication.Metadata) || (
            readerStateLocator?.audioPlaybackInfo
                && readerStateLocator?.audioPlaybackInfo.globalDuration
                && typeof readerStateLocator?.locator.locations.position === "number");

        const isDivina = isDivinaFn(r2Publication);
        const isPDF = isPdfFn(r2Publication);

        // locatorExt.docInfo.isFixedLayout
        const isFXL = r2Publication.Metadata?.Rendition?.Layout === "fixed";

        // "DAISY_audioNCX" "DAISY_textNCX" "DAISY_audioFullText"
        const isDaisy = !!r2Publication.Metadata?.AdditionalJSON?.ReadiumWebPublicationConvertedFrom;

        let lastReadTimeStamp = undefined;
        // Timestampable document.createdAt (new Date()).getTime()
        const lastReadingQueue = state.publication?.lastReadingQueue; // this.store?.getState()?
        if (lastReadingQueue) {
            for (const qItem of lastReadingQueue) {
                const timeStamp = qItem[0]; // (new Date()).getTime()
                const pubIdentifier = qItem[1];
                if (pubIdentifier === document.identifier) {
                    lastReadTimeStamp = timeStamp;
                    break;
                }
            }
        }
        return {
            isAudio,
            isDivina,
            isPDF,
            isDaisy,
            isFXL,
            lastReadTimeStamp,

            a11y_accessMode: r2Publication.Metadata.AccessMode, // string[]
            a11y_accessibilityFeature: r2Publication.Metadata.AccessibilityFeature, // string[]
            a11y_accessibilityHazard: r2Publication.Metadata.AccessibilityHazard, // string[]

            a11y_certifiedBy: r2Publication.Metadata.CertifiedBy, // string[]
            a11y_certifierCredential: r2Publication.Metadata.CertifierCredential, // string[]
            a11y_certifierReport: r2Publication.Metadata.CertifierReport, // string[]
            a11y_conformsTo: r2Publication.Metadata.ConformsTo, // string[]

            a11y_accessModeSufficient: r2Publication.Metadata.AccessModeSufficient, // (string[])[]

            // convertMultiLangStringToString
            a11y_accessibilitySummary: r2Publication.Metadata.AccessibilitySummary, // string | IStringMap

            identifier: document.identifier, // preserve Identifiable identifier
            title: document.title || "-", // default title
            authors,
            description: r2Publication.Metadata.Description,
            languages: r2Publication.Metadata.Language,
            publishers,
            workIdentifier: r2Publication.Metadata.Identifier,
            publishedAt,
            modifiedAt,
            tags: document.tags,
            cover,
            customCover: document.customCover,

            lcp: document.lcp,
            lcpRightsCopies: document.lcpRightsCopies,

            RDFType: r2Publication.Metadata.RDFType,

            duration,
            nbOfTracks,

            // doc: r2Publiction.Metadata,

            r2PublicationJson,
            // Legacy Base64 data blobs
            // r2PublicationBase64,

            lastReadingLocation: readerStateLocator,
        };
    }
}
