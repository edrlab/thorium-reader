import { injectable } from "inversify";

import { PublicationView } from "readium-desktop/common/views/publication";

import { PublicationDocument } from "readium-desktop/main/db/document/publication";

@injectable()
export class PublicationViewConverter {
    public convertDocumentToView(document: PublicationDocument): PublicationView {
        return {
            identifier: document.identifier,
            title: document.title,
            authors: [],
            languages: [],
            cover: {
                url: document.coverFile.url,
            },
            customCover: document.customCover,
        };
    }
}
