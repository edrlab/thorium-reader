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
import { JSON as TAJSON } from "ta-json-x";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

@injectable()
export class PublicationViewConverter {
    public convertDocumentToView(document: PublicationDocument): PublicationView {
        const b64ParsedPublication = document.resources.filePublication;
        const jsonParsedPublication = Buffer
            .from(b64ParsedPublication, "base64")
            .toString("utf-8");
        const parsedPublication = JSON.parse(jsonParsedPublication);
        const r2Publication = TAJSON.deserialize(parsedPublication, R2Publication) as R2Publication;
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
            identifier: document.identifier,
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
            doc: r2Publication.Metadata,
        };
    }
}
