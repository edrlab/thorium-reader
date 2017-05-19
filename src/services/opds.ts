import { injectable} from "inversify";
import * as path from "path";
import { URL } from "url";

import OPDSFeedParser from "opds-feed-parser";
import { AcquisitionFeed } from "opds-feed-parser";
import { Catalog } from "readium-desktop/models/catalog";
import { Publication } from "readium-desktop/models/publication";

import * as requestPromise from "request-promise-native";

const REL_COVER = "http://opds-spec.org/image";
const TYPE_EPUB = "application/epub+zip"

@injectable()
export class OPDSParser {
    private parser: any;

    public constructor() {
        this.parser = new OPDSFeedParser();
    }

    /**
     * Parse OPDS feed and returns a catalog
     */
    public parse(url: string): Promise<Catalog> {
        // FIXME catch errors
        return requestPromise
            .get(url)
            .then((response) => {
                return this.parser
                    .parse(response)
                    .then((feed: AcquisitionFeed) => {
                        // Create new catalog
                        let catalog: Catalog = {
                            publications: [],
                            title: feed.title,
                        };
                        for (let entry of feed.entries) {
                            let publication: Publication = {
                                title: entry.title,
                                description: entry.summary.content,
                                authors: [],
                                files: [],
                            };

                            // Fill authors
                            for (let author of entry.authors) {
                                publication.authors.push({
                                    name: author.name,
                                });
                            }

                            // Set language
                            publication.language = {
                                code: entry.language,
                            };

                            // Retrieve cover and download link
                            for (let link of entry.links) {
                                if (link.rel == REL_COVER) {
                                    // We found the cover
                                    let url = new URL(link.href)
                                    let ext = path.extname(url.pathname);

                                    // Remove dot in extension
                                    if (ext.length > 1) {
                                        ext = ext.substr(1);
                                    }

                                    publication.cover = {
                                        url: link.href,
                                        contentType: link.type,
                                        ext: ext
                                    };
                                }
                                if (link.type == TYPE_EPUB) {
                                    // We found the EPUB link
                                    let url = new URL(link.href)
                                    let ext = path.extname(url.pathname);

                                    // Remove dot in extension
                                    if (ext.length > 1) {
                                        ext = ext.substr(1);
                                    }

                                    publication.files.push({
                                        url: link.href,
                                        contentType: link.type,
                                        ext: ext
                                    });
                                }
                            }

                            catalog.publications.push(publication);
                        }

                        return catalog;
                    })
                ;
            })
        ;
    }
}
