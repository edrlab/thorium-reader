// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import * as moment from "moment";
import { CoverView, PublicationView } from "readium-desktop/common/views/publication";
import {
    convertContributorArrayToStringArray,
} from "readium-desktop/main/converter/tools/localisation";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";

import { TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";

import { diMainGet } from "../di";

@injectable()
export class PublicationViewConverter {

    @inject(diSymbolTable["publication-storage"])
    private readonly publicationStorage!: PublicationStorage;

    public async unmarshallR2Publication(
        publicationDocument: PublicationDocument,
    ): Promise<R2Publication> {

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

        return r2Publication;
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
        const r2PublicationJson = TaJsonSerialize(r2Publication);

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

        let cover: CoverView | undefined;
        if (document.coverFile) {
            cover = {
                thumbnailUrl : document.coverFile.url,
                coverUrl: document.coverFile.url,
            };
        }

        // become a side effect function : AIE !!
        // could be refactored when the publications documents will be in the state
        const store = diMainGet("store");
        const state = store.getState();
        const locator = tryCatchSync(() => state.win.registry.reader[document.identifier]?.reduxState.locator, "");

        return {
            identifier: document.identifier, // preserve Identifiable identifier
            title: document.title || "-", // default title
            authors,
            description: r2Publication.Metadata.Description,
            languages: r2Publication.Metadata.Language,
            publishers,
            workIdentifier: r2Publication.Metadata.Identifier,
            publishedAt,
            tags: document.tags,
            cover,
            customCover: document.customCover,

            lcp: document.lcp,
            lcpRightsCopies: document.lcpRightsCopies,

            RDFType: r2Publication.Metadata.RDFType,
            duration: r2Publication.Metadata.Duration,
            nbOfTracks: r2Publication.Metadata.AdditionalJSON?.tracks as number | undefined,

            // doc: r2Publiction.Metadata,

            r2PublicationJson,
            // Legacy Base64 data blobs
            // r2PublicationBase64,

            lastReadingLocation: locator,
        };
    }
}
