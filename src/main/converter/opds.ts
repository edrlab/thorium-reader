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
    IOpdsFeedView, IOpdsNavigationLink, IOpdsNavigationLinkView, IOpdsPublicationView,
    IOpdsResultView, TOpdsFeedMetadaView, TOpdsLinkViewSimplified,
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

const GetSimplifedLinkFromType = (baseUrl: string, links: OPDSLink[], type: string): TOpdsLinkViewSimplified[] => {
    const linksFiltered = links.filter((ln) => ln.TypeLink && ln.TypeLink === type && ln.Href);
    linksFiltered.forEach((ln) => ln.Href = urlPathResolve(baseUrl, ln.Href));
    return linksFiltered;
};

const GetLinkFromRel = <T extends Link>(links: T[], relValue: string | string[]): T[] =>
    links && links.filter(
        (img) => img.Rel.filter(
            (rel) => Array.isArray(relValue) ? relValue.includes(rel) : rel === relValue).length);

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
        const tags: string[] = Array.isArray(metadata.Subject) &&
            metadata.Subject.map((subject) => convertMultiLangStringToString(subject.Name));
        const publishedAt: string | undefined = metadata.PublicationDate &&
            moment(metadata.PublicationDate).toISOString();

        // resolve url in publication before extract them
        const ResolveUrlInPublication = <T extends Link>(lns: T[]): void =>
            lns && lns.forEach((ln, id, ar) => ln && ln.Href && (ar[id].Href = urlPathResolve(url, ln.Href)));
        ResolveUrlInPublication(publication.Links);
        ResolveUrlInPublication(publication.Images);

        // CoverView object
        const imagesLinks = GetLinkFromRel(publication.Images, ["image/png", "image/jpeg"]);
        const thumbnailLink = GetLinkFromRel(imagesLinks, "http://opds-spec.org/image/thumbnail")[0];
        const thumbnailUrl = (thumbnailLink && thumbnailLink.Href) || (imagesLinks[0] && imagesLinks[0].Href);
        const coverLink = GetLinkFromRel(imagesLinks, "http://opds-spec.org/image")[0];
        const coverUrl = coverLink && coverLink.Href;

        let cover: CoverView | undefined;
        if (coverUrl || thumbnailUrl) {
            cover = {
                thumbnailUrl,
                coverUrl,
            };
        }

        // Get odps entry
        const links = publication.Links.filter(
            (link) => link.TypeLink.indexOf("type=entry;profile=opds-catalog") > 0);
        const sampleLinks = GetLinkFromRel(publication.Links,
            [
                "http://opds-spec.org/acquisition/sample",
                "http://opds-spec.org/acquisition/preview",
            ]);

        // Get publication url
        const sampleUrl: string | undefined = sampleLinks.length && sampleLinks[0].Href;
        const base64OpdsPublication: string | undefined = !links.length &&
            Buffer.from(JSON.stringify(publication)).toString("base64");
        const urlPublication: string | undefined = links.length && links[0].Href;
        const isFree = GetLinkFromRel(publication.Links,
            [
                "http://opds-spec.org/acquisition",
                "http://opds-spec.org/acquisition/open-access",
            ]).length > 0;
        const buyLink: OPDSLink | undefined = GetLinkFromRel(publication.Links,
            "http://opds-spec.org/acquisition/buy")[0];
        const borrowLink: OPDSLink | undefined = GetLinkFromRel(publication.Links,
            "http://opds-spec.org/acquisition/borrow")[0];
        const subscribeLink: OPDSLink | undefined = GetLinkFromRel(publication.Links,
            "http://opds-spec.org/acquisition/subscribe")[0];

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
            buyUrl: buyLink && buyLink.Href,
            borrowUrl: borrowLink && borrowLink.Href,
            subscribeUrl: subscribeLink && subscribeLink.Href,
            hasSample: sampleUrl !== undefined,
            base64OpdsPublication,
            isFree,
        };
    }

    public async convertOpdsFeedToView(feed: OPDSFeed, url: string): Promise<IOpdsResultView> {
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
