// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug "debug";
import { injectable } from "inversify";
import * as moment from "moment";
import {
    convertContributorArrayToStringArray, convertMultiLangStringToString, urlPathResolve,
} from "readium-desktop/common/utils";
import {
    IOpdsNavigationLink, IOpdsNavigationLinkView, IOpdsPublicationView, IOpdsResultView,
    OpdsFeedView, TOpdsLinkViewSimplified,
} from "readium-desktop/common/views/opds";
import { CoverView } from "readium-desktop/common/views/publication";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";

import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// Logger
// const debug = debug_("readium-desktop:main/converter/opds");

const GetSimplifedLinkFromRel = (baseUrl: string, links: OPDSLink[], rel: string): TOpdsLinkViewSimplified[] => {
    const linksFiltered = links.filter((ln) => ln.Rel[0] && ln.Rel[0] === rel && ln.Href);
    linksFiltered.forEach((ln) => ln.Href = urlPathResolve(baseUrl, ln.Href));
    return linksFiltered;
};

@injectable()
export class OpdsFeedViewConverter {
    public convertDocumentToView(document: OpdsFeedDocument): OpdsFeedView {
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

        return  {
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
        let tags: string[] = [];

        if (metadata.Subject) {
            tags = metadata.Subject.map((subject) => convertMultiLangStringToString(subject.Name));
        }

        let publishedAt = null;

        if (metadata.PublicationDate) {
            publishedAt = moment(metadata.PublicationDate).toISOString();
        }

        let cover: CoverView | undefined;

        if (publication.Images && publication.Images.length > 0) {
            const urlCover = publication.Images[0].Href;
            cover = {
                url: urlPathResolve(url, urlCover),
            };
        }

        // Get odps entry
        let urlPublication: string | undefined;
        let sampleUrl = null;
        const links = publication.Links.filter(
            (link: any) => {
                return (link.TypeLink.indexOf(";type=entry;profile=opds-catalog") > 0);
            },
        );
        const sampleLinks = publication.Links.filter(
            (link: any) => {
                return (link.Rel[0] === "http://opds-spec.org/acquisition/sample"
                    || link.Rel[0] === "http://opds-spec.org/acquisition/preview");
            },
        );

        if (sampleLinks.length > 0) {
            sampleUrl = sampleLinks[0].Href;
        }

        let base64OpdsPublication = null;
        if (links.length > 0) {
            urlPublication = urlPathResolve(url, links[0].Href);
        } else {
            base64OpdsPublication = Buffer
            .from(JSON.stringify(publication))
            .toString("base64");
        }

        const isFree = publication.Links.filter(
            (link: any) => {
                return (link.Rel[0] === "http://opds-spec.org/acquisition"
                    || link.Rel[0] === "http://opds-spec.org/acquisition/open-access");
            },
        ).length > 0;

        const buyLink = publication.Links.filter(
            (link: any) => {
                return (link.Rel[0] === "http://opds-spec.org/acquisition/buy");
            },
        )[0];

        const borrowLink = publication.Links.filter(
            (link: any) => {
                return (link.Rel[0] === "http://opds-spec.org/acquisition/borrow");
            },
        )[0];

        const subscribeLink = publication.Links.filter(
            (link: any) => {
                return (link.Rel[0] === "http://opds-spec.org/acquisition/subscribe");
            },
        )[0];

        return  {
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
            buyUrl: buyLink && buyLink.Href,
            borrowUrl: borrowLink && borrowLink.Href,
            subscribeUrl: subscribeLink && subscribeLink.Href,
            hasSample: sampleUrl && true,
            base64OpdsPublication,
            isFree,
        };
    }

    public async convertOpdsFeedToView(feed: OPDSFeed, url: string): Promise<IOpdsResultView> {

        let publications: IOpdsPublicationView[] | undefined;
        if (feed.Publications) {
            publications = feed.Publications.map((item) => {
                return this.convertOpdsPublicationToView(item, url);
            });
        }
        let navigation: IOpdsNavigationLinkView[] | undefined;
        if (feed.Navigation) {
            navigation = feed.Navigation.map((item) => {
                return this.convertOpdsLinkToView(item, url);
            });
        }

        let links: IOpdsNavigationLink | undefined;
        if (feed.Links) {
            links = {
                next: GetSimplifedLinkFromRel(url, feed.Links, "next"),
                previous: GetSimplifedLinkFromRel(url, feed.Links, "previous"),
                first: GetSimplifedLinkFromRel(url, feed.Links, "first"),
                last: GetSimplifedLinkFromRel(url, feed.Links, "last"),
                start: GetSimplifedLinkFromRel(url, feed.Links, "start"),
                up: GetSimplifedLinkFromRel(url, feed.Links, "up"),
                search: GetSimplifedLinkFromRel(url, feed.Links, "search"),
                bookshelf: GetSimplifedLinkFromRel(url, feed.Links, "http://opds-spec.org/shelf"),
            };
        }

        return {
            Title: convertMultiLangStringToString(feed.Metadata.Title),
            NumberOfItems: typeof feed.Metadata.NumberOfItems === "number" &&
                feed.Metadata.NumberOfItems,
            ItemsPerPage: typeof feed.Metadata.ItemsPerPage === "number" &&
                feed.Metadata.ItemsPerPage,
            CurrentPage: typeof feed.Metadata.CurrentPage === "number" &&
                feed.Metadata.CurrentPage,
            publications,
            navigation,
            links,
        };
    }
}
