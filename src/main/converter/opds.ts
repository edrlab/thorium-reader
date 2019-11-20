// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug "debug";
import { injectable } from "inversify";
import * as moment from "moment";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import {
    convertContributorArrayToStringArray, convertMultiLangStringToString, urlPathResolve,
} from "readium-desktop/common/utils";
import {
    IOpdsCoverView, IOpdsFeedMetadataView, IOpdsFeedView, IOpdsLinkView, IOpdsNavigationLink,
    IOpdsNavigationLinkView, IOpdsPublicationView, IOpdsResultView,
} from "readium-desktop/common/views/opds";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { JSON as TAJSON } from "ta-json-x";

import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// Logger
// const debug = debug_("readium-desktop:main/converter/opds");

interface IGetLinksViewFilter {
    rel?: string | string[] | RegExp;
    type?: string | string[] | RegExp;
}

const GetLinksView = <T extends Link>(
    baseUrl: string,
    links: T[] | undefined,
    filter: IGetLinksViewFilter)
    : IOpdsLinkView[] => {
    const formatedLinks: IOpdsLinkView[] = [];

    const linksFiltered = links?.filter((ln) => {
        let relFlag: boolean = false;
        let typeFlag: boolean = false;

        if (ln.Href) {
            if (filter.rel) {
                if (ln.Rel.length) {
                    ln.Rel.forEach((rel) => {
                        if (Array.isArray(filter.rel) && filter.rel.includes(rel)) {
                            relFlag = true;
                        } else if (filter.rel instanceof RegExp && filter.rel.test(rel)) {
                            relFlag = true;
                        } else if (rel.replace(/\s/g, "") === filter.rel) {
                            relFlag = true;
                        }
                    });
                }
            }
            if (filter.type) {
                if (ln.TypeLink) {
                    if (Array.isArray(filter.type) && filter.type.includes(ln.TypeLink)) {
                        typeFlag = true;
                    } else if (filter.type instanceof RegExp && filter.type.test(ln.TypeLink)) {
                        typeFlag = true;
                    } else if (typeof filter.type === "string") {

                        // compare typeSet and filterSet
                        const filterSet = new Set(filter.type.split(";"));
                        const typeSet = new Set(ln.TypeLink.replace( /\s/g, "").split(";"));

                        typeFlag = true;
                        for (const i in typeSet.keys) {
                            if (!filterSet.has(i)) {
                                typeFlag = false;
                                break;
                            }
                        }
                    }
                }
            }
            if (filter.type && filter.rel) {
                if (relFlag && typeFlag) {
                    return true;
                }
                return false;
            }
        }

        return relFlag || typeFlag;
    });

    // transform to absolute url
    linksFiltered?.forEach((ln) => ln.Href = urlPathResolve(baseUrl, ln.Href));

    // safe copy on each filtered links
    linksFiltered?.forEach((ln) => formatedLinks.push({
        url: ln.Href,
        title: ln.Title,
        type: ln.TypeLink,
    }));

    return formatedLinks;
};

@injectable()
export class OpdsFeedViewConverter {
    public convertDocumentToView(document: OpdsFeedDocument): IOpdsFeedView {
        return {
            identifier: document.identifier, // preserve Identifiable identifier
            title: document.title,
            url: document.url,
        };
    }

    public convertOpdsLinkToView(link: OPDSLink, baseUrl: string): IOpdsNavigationLinkView {
        // Title could be defined on multiple lines
        // Only keep the first one
        const titleParts = link.Title.split("\n").filter((text) => text);
        const title = titleParts[0].trim();
        const subtitle = titleParts[1] && titleParts[1].trim();

        return {
            title,
            subtitle,
            url: urlPathResolve(baseUrl, link.Href),
            numberOfItems: link.Properties && link.Properties.NumberOfItems,
        };
    }

    // warning: modifies r2OpdsPublication, makes relative URLs absolute with baseUrl!
    public convertOpdsPublicationToView(r2OpdsPublication: OPDSPublication, baseUrl: string): IOpdsPublicationView {
        const metadata = r2OpdsPublication.Metadata;
        const title = convertMultiLangStringToString(metadata.Title);
        const authors = convertContributorArrayToStringArray(metadata.Author);
        const publishers = convertContributorArrayToStringArray(metadata.Publisher);
        const tags = Array.isArray(metadata.Subject) &&
            metadata.Subject.map((subject) => convertMultiLangStringToString(subject.Name));
        const publishedAt = metadata.PublicationDate &&
            moment(metadata.PublicationDate).toISOString();

        // CoverView object
        const coverLinkView = GetLinksView(baseUrl, r2OpdsPublication.Images, {
            rel: "http://opds-spec.org/image",
        });
        const thumbnailLinkView = GetLinksView(baseUrl, r2OpdsPublication.Images, {
            type: ["image/png", "image/jpeg"],
            rel: "http://opds-spec.org/image/thumbnail",
        }) || GetLinksView(baseUrl, r2OpdsPublication.Links, {
            type: ["image/png", "image/jpeg"],
        }) || GetLinksView(baseUrl, r2OpdsPublication.Links, {
            type: new RegExp("^image\/*"),
        });

        let cover: IOpdsCoverView | undefined;
        if (thumbnailLinkView) {
            cover = {
                thumbnailLinks: thumbnailLinkView,
                coverLinks: coverLinkView,
            };
        }

        // Get odps entry
        const entrylinksViews = GetLinksView(baseUrl, r2OpdsPublication.Links, {
            type: "type=entry;profile=opds-catalog",
        });
        const sampleLinkView = GetLinksView(baseUrl, r2OpdsPublication.Links, {
                rel: [
                    "http://opds-spec.org/acquisition/sample",
                    "http://opds-spec.org/acquisition/preview",
                ],
        });
        const acquisitionLinkView = GetLinksView(baseUrl, r2OpdsPublication.Links, {
                rel: [
                    "http://opds-spec.org/acquisition",
                    "http://opds-spec.org/acquisition/open-access",
                ],
        });
        const buyLinkView = GetLinksView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/buy",
        });
        const borrowLinkView = GetLinksView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/borrow",
        });
        const subscribeLinkView = GetLinksView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/subscribe",
        });

        const r2OpdsPublicationJson = TAJSON.serialize(r2OpdsPublication);
        const r2OpdsPublicationStr = JSON.stringify(r2OpdsPublicationJson);
        const r2OpdsPublicationBase64 = Buffer.from(r2OpdsPublicationStr).toString("base64");

        return {
            baseUrl,
            r2OpdsPublicationBase64,
            title,
            authors,
            publishers,
            workIdentifier: metadata.Identifier,
            description: metadata.Description,
            tags,
            languages: metadata.Language,
            publishedAt,
            cover,
            entryLinks: entrylinksViews,
            buyLinks: buyLinkView,
            borrowLinks: borrowLinkView,
            subscribeLinks: subscribeLinkView,
            sampleOrPreviewLinks: sampleLinkView,
            openAccessLinks: acquisitionLinkView,
        };
    }

    public convertOpdsFeedToView(r2OpdsFeed: OPDSFeed, baseUrl: string): IOpdsResultView {

        const title = convertMultiLangStringToString(r2OpdsFeed.Metadata && r2OpdsFeed.Metadata.Title);
        const publications = r2OpdsFeed.Publications?.map((item) => {
                return this.convertOpdsPublicationToView(item, baseUrl);
            });
        const navigation = r2OpdsFeed.Navigation?.map((item) => {
                return this.convertOpdsLinkToView(item, baseUrl);
            });
        const links: IOpdsNavigationLink = r2OpdsFeed.Links &&
        {
            next: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "next" }),
            previous: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "previous" }),
            first: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "first" }),
            last: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "last" }),
            start: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "start" }),
            up: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "up" }),
            search: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "search" }),
            bookshelf: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "http://opds-spec.org/shelf" }),
            text: GetLinksView(baseUrl, r2OpdsFeed.Links, { type: "text/html" }),
            self: GetLinksView(baseUrl, r2OpdsFeed.Links, { rel: "self" }),
        };
        const metadata: IOpdsFeedMetadataView = r2OpdsFeed.Metadata &&
        {
            numberOfItems: typeof r2OpdsFeed.Metadata.NumberOfItems === "number" &&
                r2OpdsFeed.Metadata.NumberOfItems,
            itemsPerPage: typeof r2OpdsFeed.Metadata.ItemsPerPage === "number" &&
                r2OpdsFeed.Metadata.ItemsPerPage,
            currentPage: typeof r2OpdsFeed.Metadata.CurrentPage === "number" &&
                r2OpdsFeed.Metadata.CurrentPage,
        };

        return {
            title,
            metadata,
            publications,
            navigation,
            links,
        };
    }
}
