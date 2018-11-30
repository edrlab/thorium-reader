import { injectable } from "inversify";

import * as moment from "moment";

import { JSON as TAJSON } from "ta-json-x";

import { Publication as Epub } from "@r2-shared-js/models/publication";

import { PublicationView } from "readium-desktop/common/views/publication";

import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { Contributor } from "opds-feed-parser";

@injectable()
export class PublicationViewConverter {
    public convertDocumentToView(document: PublicationDocument): PublicationView {
        const epub = TAJSON.deserialize(document.publication, Epub) as Epub;
        const publishers = this.convertContibutorArrayToStringArray(
            epub.Metadata.Publisher
        );
        const authors = this.convertContibutorArrayToStringArray(
            epub.Metadata.Author
        );

        return {
            identifier: document.identifier,
            title: document.title,
            authors: authors,
            languages: epub.Metadata.Language,
            publishers: publishers,
            workIdentifier: epub.Metadata.Identifier,
            publishedAt: moment(epub.Metadata.PublicationDate).toISOString(),
            tags: document.tags,
            cover: {
                url: document.coverFile.url,
            },
            customCover: document.customCover,
        };
    }

    private convertContibutorArrayToStringArray(items: any): string[] {
        const itemParts = items.map((item: any) => {
            if (typeof(item.Name) == "object") {
                return Object.values(item.Name);
            }

            return [item.Name];
        });

        let newItems: any = [];

        for (const itemPart of itemParts) {
            newItems = newItems.concat(itemPart);
        }

        return newItems;
    }
}
