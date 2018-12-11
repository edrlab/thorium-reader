import { injectable } from "inversify";

import { OpdsFeedView } from "readium-desktop/common/views/opds";

import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";

@injectable()
export class OpdsFeedViewConverter {
    public convertDocumentToView(document: OpdsFeedDocument): OpdsFeedView {
        return {
            identifier: document.identifier,
            title: document.title,
            url: document.url,
        };
    }
}
