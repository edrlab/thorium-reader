// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as moment from "moment";
import { convertContributorArrayToStringArray } from "readium-desktop/common/utils";
import { PublicationView } from "readium-desktop/common/views/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { JSON as TAJSON } from "ta-json-x";

import { Publication as Epub } from "@r2-shared-js/models/publication";

@injectable()
export class PublicationViewConverter {
    public convertDocumentToView(document: PublicationDocument): PublicationView {
        const b64ParsedPublication = document.resources.filePublication;
        const jsonParsedPublication = Buffer
            .from(b64ParsedPublication, "base64")
            .toString("utf-8");
        const parsedPublication = JSON.parse(jsonParsedPublication);
        const epub = TAJSON.deserialize(parsedPublication, Epub) as Epub;
        const publishers = convertContributorArrayToStringArray(
            epub.Metadata.Publisher,
        );
        const authors = convertContributorArrayToStringArray(
            epub.Metadata.Author,
        );
        let publishedAt = null;

        if (epub.Metadata.PublicationDate) {
            publishedAt = moment(epub.Metadata.PublicationDate).toISOString();
        }

        let cover = null;

        if (document.coverFile) {
            cover = {
                url : document.coverFile.url,
            };
        }

        return {
            identifier: document.identifier,
            title: document.title,
            authors,
            description: epub.Metadata.Description,
            languages: epub.Metadata.Language,
            publishers,
            workIdentifier: epub.Metadata.Identifier,
            publishedAt,
            tags: document.tags,
            cover,
            customCover: document.customCover,
            lcp: document.lcp,
            doc: epub.Metadata,
        };
    }
}
