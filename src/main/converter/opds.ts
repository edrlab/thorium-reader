// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { injectable } from "inversify";
import * as moment from "moment";
import {
    convertContributorArrayToStringArray, convertMultiLangStringToString,
} from "readium-desktop/common/utils";
import { httpGet } from "readium-desktop/common/utils/http";
import {
    OpdsFeedView,
    OpdsLinkView,
    OpdsPublicationView,
    OpdsResultPageInfos,
    OpdsResultType,
    OpdsResultUrls,
    OpdsResultView,
} from "readium-desktop/common/views/opds";
import { CoverView } from "readium-desktop/common/views/publication";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { resolve } from "url";
import * as convert from "xml-js";

import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// Logger
const debug = debug_("readium-desktop:main/converter/opds");

const urlPathResolve = (from: string, to: string) =>
        to && !/^https?:\/\//.exec(to) && !/^data:\/\//.exec(to) ? resolve(from, to) : to;

@injectable()
export class OpdsFeedViewConverter {
    public convertDocumentToView(document: OpdsFeedDocument): OpdsFeedView {
        return {
            identifier: document.identifier,
            title: document.title,
            url: document.url,
        };
    }

    public convertOpdsLinkToView(link: OPDSLink, url: string): OpdsLinkView {
        // Title could be defined on multiple lines
        // Only keep the first one
        let title = link.Title;
        const titleParts = title.split("\n");
        title = titleParts[0];

        return  {
            title,
            url: urlPathResolve(url, link.Href),
            publicationCount: (link.Children) ? link.Children.length : null,
        };
    }

    public convertOpdsPublicationToView(publication: OPDSPublication, url: string): OpdsPublicationView {
        const metadata = publication.Metadata;
        const title = convertMultiLangStringToString(metadata.Title);
        const authors = convertContributorArrayToStringArray(metadata.Author);
        const publishers = convertContributorArrayToStringArray(metadata.Publisher);

        let tags: string[] = [];
        if (metadata.Subject) {
            tags = metadata.Subject.map((subject) => convertMultiLangStringToString(subject.Name));
        }

        let publishedAt: string | undefined;
        if (metadata.PublicationDate) {
            publishedAt = moment(metadata.PublicationDate).toISOString();
        }

        // CoverView object
        let cover: CoverView | undefined;
        if (publication.Images && publication.Images.length > 0) {
            const imagesLinks = publication.Images.filter(
                (link) => link.TypeLink === "image/png" || link.TypeLink === "image/jpeg");

            const thumbnailLink = imagesLinks.filter(
                (img) => img.Rel.filter(
                    (rel) => rel === "http://opds-spec.org/image/thumbnail").length)[0];
            const thumbnailUrl = (thumbnailLink && urlPathResolve(url, thumbnailLink.Href))
                || (imagesLinks[0] && urlPathResolve(url, imagesLinks[0].Href));

            const coverLink = imagesLinks.filter(
                (img) => img.Rel.filter(
                    (rel) => rel === "http://opds-spec.org/image").length)[0];
            const coverUrl = coverLink && urlPathResolve(url, coverLink.Href);

            if (coverUrl || thumbnailUrl) {
                cover = {
                    thumbnailUrl,
                    coverUrl,
                };
            }
        }

        // Get odps entry
        const links = publication.Links.filter(
            (link) => link.TypeLink.indexOf(";type=entry;profile=opds-catalog") > 0);
        const sampleLinks = publication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/sample"
                            || relLink === "http://opds-spec.org/acquisition/preview").length);

        let sampleUrl: string | undefined;
        if (sampleLinks.length > 0) {
            sampleUrl = sampleLinks[0].Href;
        }

        let base64OpdsPublication: string | undefined;
        let urlPublication: string | undefined;
        if (links.length > 0) {
            urlPublication = urlPathResolve(url, links[0].Href);
        } else {
            base64OpdsPublication = Buffer
            .from(JSON.stringify(publication))
            .toString("base64");
        }

        const isFree = publication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition"
                    || relLink === "http://opds-spec.org/acquisition/open-access").length,
        ).length > 0;

        const buyLink: OPDSLink | undefined = publication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/buy").length)[0];

        const borrowLink: OPDSLink | undefined = publication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/borrow").length)[0];

        const subscribeLink: OPDSLink | undefined = publication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/subscribe").length)[0];

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

    public async convertOpdsFeedToView(feed: OPDSFeed, url: string): Promise<OpdsResultView> {
        const title = convertMultiLangStringToString(feed.Metadata.Title);
        let type = OpdsResultType.Empty;
        let navigation: OpdsLinkView[] | undefined;
        let publications: OpdsPublicationView[] | undefined;

        let urls: OpdsResultUrls = {};
        let page: OpdsResultPageInfos;

        if (feed.Publications) {
            // result page containing publications
            type = OpdsResultType.PublicationFeed;
            publications = feed.Publications.map((item) => {
                return this.convertOpdsPublicationToView(item, url);
            });
        } else if (feed.Navigation) {
            // result page containing navigation
            type = OpdsResultType.NavigationFeed;
            navigation = feed.Navigation.map((item) => {
                return this.convertOpdsLinkToView(item, url);
            });

            // concatenate all relative path to an absolute URL path
            navigation = navigation.map((nav) => {
                nav.url = urlPathResolve(url, nav.url);
                return nav;
            });
        }
        if (feed.Links) {
            urls = {
                search: await this.getSearchUrlFromOpds1Feed(feed),
                nextPage: this.getUrlFromFeed(feed, "next"),
                previousPage: this.getUrlFromFeed(feed, "previous"),
                firstPage: this.getUrlFromFeed(feed, "first"),
                lastPage: this.getUrlFromFeed(feed, "last"),
            };
        }

        if (feed.Metadata) {
            page = {
                numberOfItems: feed.Metadata.NumberOfItems,
                itemsPerPage: feed.Metadata.ItemsPerPage,
            };
        }

        return {
            title,
            type,
            publications,
            navigation,
            urls,
            page,
        };
    }

    private getUrlFromFeed(feed: OPDSFeed, linkRel: string): string | undefined {
        const linkWithRel = feed.Links.find((link) => link.Rel && link.Rel.includes(linkRel));
        return linkWithRel ? linkWithRel.Href : undefined;
    }

    private async getSearchUrlFromOpds1Feed(feed: OPDSFeed): Promise<string| undefined> {
        // https://github.com/readium/readium-desktop/issues/296#issuecomment-502134459

        let searchUrl: string | undefined;
        try {
            if (feed.Links) {
                const searchLink = feed.Links.find((value) => value.Rel[0] === "search");
                if (searchLink) {
                    if (searchLink.TypeLink === "application/opds+json") {
                        searchUrl = searchLink.Href;
                    } else {
                        const searchLinkFeedData = await httpGet(searchLink.Href);
                        if (searchLinkFeedData.isFailure) {
                            return undefined;
                        }
                        const result = convert.xml2js(searchLinkFeedData.data,
                            { compact: true }) as convert.ElementCompact;

                        if (result) {
                            const doc = result.OpenSearchDescription;
                            searchUrl = doc.Url.find((value: any) => {
                                return value._attributes && value._attributes.type === "application/atom+xml";
                            })._attributes.template;
                        }
                    }
                }
            }
        } catch (e) {
            debug("getSearchUrlFromOpds1Feed", e);
        }
        // if searchUrl is not found return undefined
        // The user will not be able to use the search form
        return searchUrl;
    }
}
