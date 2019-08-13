// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";
import * as path from "path";
import { URL } from "url";
import * as uuid from "uuid";

import OPDSFeedParser from "opds-feed-parser/lib/src/index";
import { AcquisitionFeed } from "opds-feed-parser/lib/src/index";
import { Catalog } from "readium-desktop/common/models/catalog";
import { Publication } from "readium-desktop/common/models/publication";

const REL_COVER = "http://opds-spec.org/image";
const TYPE_EPUB = "application/epub+zip";

@injectable()
export class OPDSParser {
    private parser: any;

    public constructor() {
        this.parser = new OPDSFeedParser();
    }

    /**
     * Parse OPDS feed and returns a catalog
     */
    public async parse(opdsFeed: string): Promise<Catalog> {
        return this.parser
            .parse(opdsFeed)
            .then((feed: AcquisitionFeed) => {
                // Create new catalog
                const catalog: Catalog = {
                    publications: [],
                    title: feed.title,
                };

                for (const entry of feed.entries) {
                    const publication: Publication = {
                        identifier: uuid.v4(),
                        title: entry.title,
                        description: entry.summary.content,
                        authors: [],
                        files: [],
                    };

                    // Fill authors
                    for (const author of entry.authors) {
                        publication.authors.push({
                            name: author.name,
                        });
                    }

                    // Set language
                    publication.languages = [{
                        code: entry.language,
                    }];

                    // Retrieve cover and download link
                    for (const link of entry.links) {
                        if (link.rel === REL_COVER) {
                            // We found the cover
                            const urlObj = new URL(link.href);
                            let extObj = path.extname(urlObj.pathname);

                            // Remove dot in extension
                            if (extObj.length > 1) {
                                extObj = extObj.substr(1);
                            }

                            publication.cover = {
                                url: link.href,
                                contentType: link.type,
                                ext: extObj,
                            };
                        }
                        if (link.type === TYPE_EPUB) {
                            // We found the EPUB link
                            const urlObj = new URL(link.href);
                            let extObj = path.extname(urlObj.pathname);

                            // Remove dot in extension
                            if (extObj.length > 1) {
                                extObj = extObj.substr(1);
                            }

                            publication.files.push({
                                url: link.href,
                                contentType: link.type,
                                ext: extObj,
                            });
                        }
                    }

                    catalog.publications.push(publication);
                }

                return catalog;
            })
            .catch((err: any) => {
                console.error(err);
            })
        ;
    }
}
