// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as moment from "moment";
import { convertContributorArrayToStringArray } from "readium-desktop/common/utils";
import { CoverView, PublicationView } from "readium-desktop/common/views/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

@injectable()
export class PublicationViewConverter {

    // Note: PublicationDocument and PublicationView are both Identifiable, with identical `identifier`
    public convertDocumentToView(document: PublicationDocument): PublicationView {
        const r2PublicationBase64 = document.resources.r2PublicationBase64;
        const r2PublicationStr = Buffer.from(r2PublicationBase64, "base64").toString("utf-8");
        const r2PublicationJson = JSON.parse(r2PublicationStr);
        const r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);
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

        return {
            identifier: document.identifier, // preserve Identifiable identifier
            title: document.title,
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

            // doc: r2Publication.Metadata,

            r2PublicationBase64,
        };
    }
}
