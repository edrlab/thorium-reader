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
    IOpdsFeedView, IOpdsLinkView, IOpdsNavigationLink, IOpdsNavigationLinkView,
    IOpdsPublicationView, IOpdsResultView, TOpdsFeedMetadaView,
} from "readium-desktop/common/views/opds";
import { CoverView } from "readium-desktop/common/views/publication";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { JSON as TAJSON } from "ta-json-x";

import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// Logger
// const debug = debug_("readium-desktop:main/converter/opds");

interface IGetLinksViewFilter {
    rel?: string | string[];
    type?: string | string[];
}

const GetLinksView = <T extends Link>(baseUrl: string, links: T[], filter: IGetLinksViewFilter)
    : IOpdsLinkView[] => {
    const formatedLinks: IOpdsLinkView[] = [];

    const linksFiltered = links.filter((ln) => {
        let relFlag: boolean = false;
        let typeFlag: boolean = false;
        if (ln.Href) {
            if (filter.rel) {
                if (ln.Rel[0] &&
                        Array.isArray(filter.rel) ?
                            filter.rel.includes(ln.Rel[0]) :
                            ln.Rel[0].replace( /\s/g, "") === filter.rel) {
                    relFlag = true;
                }
            }
            if (filter.type) {
                if (ln.TypeLink &&
                        Array.isArray(filter.type) ?
                            filter.type.includes(ln.TypeLink) :
                            ln.TypeLink.replace( /\s/g, "") === filter.type) {
                    typeFlag = true;
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

    linksFiltered.forEach((ln) => ln.Href = urlPathResolve(baseUrl, ln.Href));
    // safe copy on each filtered links
    linksFiltered.forEach((ln) => formatedLinks.push({
        url: ln.Href,
        title: ln.Title,
    }));

    return formatedLinks;
};

@injectable()
export class OpdsFeedViewConverter {
    public convertDocumentToView(document: OpdsFeedDocument): IOpdsFeedView {
        return {
            identifier: document.identifier,
            title: document.title,
            url: document.url,
        };
    }

    public convertOpdsLinkToView(link: OPDSLink, url: string): IOpdsNavigationLinkView {
        // Title could be defined on multiple lines
        // Only keep the first one
        const titleParts = link.Title.split("\n").filter((text) => text);
        const title = titleParts[0].trim();
        const subtitle = titleParts[1] && titleParts[1].trim();

        return {
            title,
            subtitle,
            url: urlPathResolve(url, link.Href),
            numberOfItems: link.Properties && link.Properties.NumberOfItems,
        };
    }

    public convertOpdsPublicationToView(publication: OPDSPublication, url: string): IOpdsPublicationView {
        const metadata = publication.Metadata;
        const title = convertMultiLangStringToString(metadata.Title);
        const authors = convertContributorArrayToStringArray(metadata.Author);
        const publishers = convertContributorArrayToStringArray(metadata.Publisher);
        const tags = Array.isArray(metadata.Subject) &&
            metadata.Subject.map((subject) => convertMultiLangStringToString(subject.Name));
        const publishedAt = metadata.PublicationDate &&
            moment(metadata.PublicationDate).toISOString();

        // resolve url in publication before extract them
        const ResolveUrlInPublication = <T extends Link>(lns: T[]): void =>
            lns && lns.forEach((ln, id, ar) => ln && ln.Href && (ar[id].Href = urlPathResolve(url, ln.Href)));
        ResolveUrlInPublication(publication.Links);
        ResolveUrlInPublication(publication.Images);

        // CoverView object
        const thumbnailLinkView = GetLinksView(url, publication.Images, {
            type: ["image/png", "image/jpeg"],
            rel: "http://opds-spec.org/image/thumbnail",
        })[0] || GetLinksView(url, publication.Images, {
            type: ["image/png", "image/jpeg"],
        })[0];
        const coverLinkView = GetLinksView(url, publication.Images, {
            rel: "http://opds-spec.org/image",
        })[0];

        let cover: CoverView | undefined;
        if (coverLinkView || thumbnailLinkView) {
            cover = {
                thumbnailUrl: thumbnailLinkView.url,
                coverUrl: coverLinkView.url,
            };
        }

        // Get odps entry
        const entrylinksViews = GetLinksView(url, publication.Links, {
            type: "application/atom+xml;type=entry;profile=opds-catalog",
        })[0];
        const urlPublication = entrylinksViews && entrylinksViews.url;
        const base64OpdsPublication = !entrylinksViews &&
            Buffer.from(JSON.stringify(publication)).toString("base64");

        const hasSample = GetLinksView(url, publication.Links, {
                type: [
                    "http://opds-spec.org/acquisition/sample",
                    "http://opds-spec.org/acquisition/preview",
                ],
        }).length > 0;
        const isFree = GetLinksView(url, publication.Links, {
                type: [
                    "http://opds-spec.org/acquisition",
                    "http://opds-spec.org/acquisition/open-access",
                ],
        }).length > 0;
        const buyLinkView = GetLinksView(url, publication.Links, {
            type: "http://opds-spec.org/acquisition/buy",
        })[0];
        const borrowLinkView = GetLinksView(url, publication.Links, {
            type: "http://opds-spec.org/acquisition/borrow",
        })[0];
        const subscribeLinkView = GetLinksView(url, publication.Links, {
            type: "http://opds-spec.org/acquisition/subscribe",
        })[0];

        return {
            title,
            authors,
            publishers,
            workIdentifier: metadata.Identifier,
            description: metadata.Description,
            tags,
            languages: metadata.Language,
            publishedAt,
            cover,
            url: urlPublication,
            buyUrl: buyLinkView && buyLinkView.url,
            borrowUrl: borrowLinkView && borrowLinkView.url,
            subscribeUrl: subscribeLinkView && subscribeLinkView.url,
            hasSample,
            base64OpdsPublication,
            isFree,
        };
    }

    public async convertOpdsFeedToView(feedSerialize: OPDSFeed, url: string): Promise<IOpdsResultView> {
        const feed = TAJSON.deserialize<OPDSFeed>(feedSerialize);
        const Title = convertMultiLangStringToString(feed.Metadata && feed.Metadata.Title);
        const publications: IOpdsPublicationView[] | undefined = feed.Publications &&
            feed.Publications.map((item) => {
                return this.convertOpdsPublicationToView(item, url);
            });
        const navigation: IOpdsNavigationLinkView[] | undefined = feed.Navigation &&
            feed.Navigation.map((item) => {
                return this.convertOpdsLinkToView(item, url);
            });
        const links: IOpdsNavigationLink | undefined = feed.Links &&
            {
                next: GetSimplifedLinkFromRel(url, feed.Links, "next"),
                previous: GetSimplifedLinkFromRel(url, feed.Links, "previous"),
                first: GetSimplifedLinkFromRel(url, feed.Links, "first"),
                last: GetSimplifedLinkFromRel(url, feed.Links, "last"),
                start: GetSimplifedLinkFromRel(url, feed.Links, "start"),
                up: GetSimplifedLinkFromRel(url, feed.Links, "up"),
                search: GetSimplifedLinkFromRel(url, feed.Links, "search"),
                bookshelf: GetSimplifedLinkFromRel(url, feed.Links, "http://opds-spec.org/shelf"),
                text: GetSimplifedLinkFromType(url, feed.Links, "text/html"),
                self: GetSimplifedLinkFromRel(url, feed.Links, "self"),
            };
        const metadata: TOpdsFeedMetadaView | undefined = feed.Metadata &&
            {
                NumberOfItems: typeof feed.Metadata.NumberOfItems === "number" &&
                    feed.Metadata.NumberOfItems,
                ItemsPerPage: typeof feed.Metadata.ItemsPerPage === "number" &&
                    feed.Metadata.ItemsPerPage,
                CurrentPage: typeof feed.Metadata.CurrentPage === "number" &&
                    feed.Metadata.CurrentPage,
            };

        return {
            Title,
            metadata,
            publications,
            navigation,
            links,
        };
    }
}
