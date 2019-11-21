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
    convertContributorArrayToStringArray, convertMultiLangStringToString, urlPathResolve,
} from "readium-desktop/common/utils";
import { httpGet } from "readium-desktop/common/utils/http";
import {
    OpdsFeedView, OpdsLinkView, OpdsPublicationView, OpdsResultPageInfos, OpdsResultType,
    OpdsResultUrls, OpdsResultView,
} from "readium-desktop/common/views/opds";
import { CoverView } from "readium-desktop/common/views/publication";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import * as convert from "xml-js";

import { TaJsonSerialize } from "@r2-lcp-js/serializable";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// Logger
const debug = debug_("readium-desktop:main/converter/opds");

@injectable()
export class OpdsFeedViewConverter {

    // Note: OpdsFeedDocument and OpdsFeedView are both Identifiable, with identical `identifier`
    public convertDocumentToView(document: OpdsFeedDocument): OpdsFeedView {
        return {
            identifier: document.identifier, // preserve Identifiable identifier
            title: document.title,
            url: document.url,
        };
    }

    public convertOpdsLinkToView(link: OPDSLink, baseURl: string): OpdsLinkView {
        // Title could be defined on multiple lines
        // Only keep the first one
        const titleParts = link.Title.split("\n").filter((text) => text);
        const title = titleParts[0].trim();
        const subtitle = titleParts[1] && titleParts[1].trim();

        return  {
            title,
            subtitle,
            url: urlPathResolve(baseURl, link.Href),
            numberOfItems: link.Properties && link.Properties.NumberOfItems,
        };
    }

    // warning: modifies r2OpdsPublication, makes relative URLs absolute with baseUrl!
    public convertOpdsPublicationToView(r2OpdsPublication: OPDSPublication, baseUrl: string): OpdsPublicationView {
        const metadata = r2OpdsPublication.Metadata;
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

        // resolve url in publication before extract them
        if (r2OpdsPublication.Links) {
            r2OpdsPublication.Links.forEach((ln) => {
                return ln && ln.Href && (ln.Href = urlPathResolve(baseUrl, ln.Href));
            });
        }
        if (r2OpdsPublication.Images) {
            r2OpdsPublication.Images.forEach((ln) => {
                return ln && ln.Href && (ln.Href = urlPathResolve(baseUrl, ln.Href));
            });
        }

        // CoverView object
        let cover: CoverView | undefined;
        if (r2OpdsPublication.Images && r2OpdsPublication.Images.length > 0) {
            const imagesLinks = r2OpdsPublication.Images.filter(
                (link) => link.TypeLink === "image/png" || link.TypeLink === "image/jpeg");

            const firstThumbnailLink = imagesLinks.filter(
                (img) => img.Rel.filter(
                    (rel) => rel === "http://opds-spec.org/image/thumbnail").length)[0];
            const thumbnailUrl = firstThumbnailLink ? firstThumbnailLink.Href :
                (imagesLinks[0] ? imagesLinks[0].Href : undefined);

            const firstCoverLink = imagesLinks.filter(
                (img) => img.Rel.filter(
                    (rel) => rel === "http://opds-spec.org/image").length)[0];
            const coverUrl = firstCoverLink ? firstCoverLink.Href : undefined;

            if (coverUrl || thumbnailUrl) {
                cover = {
                    thumbnailUrl,
                    coverUrl,
                };
            }
        }

        const firstEntryLink: OPDSLink | undefined = r2OpdsPublication.Links.filter(
            (link) => link.TypeLink.indexOf(";type=entry;profile=opds-catalog") > 0)[0];

        const firstSampleOrPreviewLink = r2OpdsPublication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/sample"
                    || relLink === "http://opds-spec.org/acquisition/preview").length)[0];

        const firstOpenAccessLink = r2OpdsPublication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition"
                    || relLink === "http://opds-spec.org/acquisition/open-access").length)[0];

        const firstBuyLink: OPDSLink | undefined = r2OpdsPublication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/buy").length)[0];

        const firstBorrowLink: OPDSLink | undefined = r2OpdsPublication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/borrow").length)[0];

        const firstSubscribeLink: OPDSLink | undefined = r2OpdsPublication.Links.filter(
            (link) => link.Rel.filter(
                (relLink) => relLink === "http://opds-spec.org/acquisition/subscribe").length)[0];

        const r2OpdsPublicationJson = TaJsonSerialize(r2OpdsPublication);
        const r2OpdsPublicationStr = JSON.stringify(r2OpdsPublicationJson);
        const r2OpdsPublicationBase64 = Buffer.from(r2OpdsPublicationStr).toString("base64");

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
            entryUrl: firstEntryLink ? firstEntryLink.Href : undefined,
            buyUrl: firstBuyLink ? firstBuyLink.Href : undefined,
            borrowUrl: firstBorrowLink ? firstBorrowLink.Href : undefined,
            subscribeUrl: firstSubscribeLink ? firstSubscribeLink.Href : undefined,
            sampleOrPreviewUrl: firstSampleOrPreviewLink ? firstSampleOrPreviewLink.Href : undefined,
            openAccessUrl: firstOpenAccessLink ? firstOpenAccessLink.Href : undefined,
            r2OpdsPublicationBase64,
            baseUrl,
        };
    }

    // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl!
    public async convertOpdsFeedToView(r2OpdsFeed: OPDSFeed, baseUrl: string): Promise<OpdsResultView> {
        const title = convertMultiLangStringToString(r2OpdsFeed.Metadata.Title);
        let type = OpdsResultType.Empty;
        let navigation: OpdsLinkView[] | undefined;
        let opdsPublicationViews: OpdsPublicationView[] | undefined;

        let urls: OpdsResultUrls = {};
        let page: OpdsResultPageInfos;

        if (r2OpdsFeed.Publications) {
            type = OpdsResultType.PublicationFeed;
            opdsPublicationViews = r2OpdsFeed.Publications.map((item) => {
                // warning: modifies item, makes relative URLs absolute with baseUrl!
                return this.convertOpdsPublicationToView(item, baseUrl);
            });
        } else if (r2OpdsFeed.Navigation) {
            // result page containing navigation
            type = OpdsResultType.NavigationFeed;
            navigation = r2OpdsFeed.Navigation.map((item) => {
                return this.convertOpdsLinkToView(item, baseUrl);
            });

            // concatenate all relative path to an absolute URL path
            navigation = navigation.map((nav) => {
                nav.url = urlPathResolve(baseUrl, nav.url);
                return nav;
            });
        }
        if (r2OpdsFeed.Links) {
            urls = {
                search: urlPathResolve(baseUrl, await this.getSearchUrlFromOpds1Feed(r2OpdsFeed)),
                nextPage: urlPathResolve(baseUrl, this.getUrlFromFeed(r2OpdsFeed, "next")),
                previousPage: urlPathResolve(baseUrl, this.getUrlFromFeed(r2OpdsFeed, "previous")),
                firstPage: urlPathResolve(baseUrl, this.getUrlFromFeed(r2OpdsFeed, "first")),
                lastPage: urlPathResolve(baseUrl, this.getUrlFromFeed(r2OpdsFeed, "last")),
            };
        }

        if (r2OpdsFeed.Metadata) {
            page = {
                numberOfItems: r2OpdsFeed.Metadata.NumberOfItems,
                itemsPerPage: r2OpdsFeed.Metadata.ItemsPerPage,
            };
        }

        return {
            title,
            type,
            opdsPublicationViews,
            navigation,
            urls,
            page,
        };
    }

    private getUrlFromFeed(r2OpdsFeed: OPDSFeed, linkRel: string): string | undefined {
        const linkWithRel = r2OpdsFeed.Links.find((link) => link.Rel && link.Rel.includes(linkRel));
        return linkWithRel ? linkWithRel.Href : undefined;
    }

    private async getSearchUrlFromOpds1Feed(r2OpdsFeed: OPDSFeed): Promise<string| undefined> {
        // https://github.com/readium/readium-desktop/issues/296#issuecomment-502134459

        let searchUrl: string | undefined;
        try {
            if (r2OpdsFeed.Links) {
                const searchLink = r2OpdsFeed.Links.find((value) => value.Rel[0] === "search");
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
                            searchUrl = doc.Url.find((value: any) => { // TODO any?!
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
