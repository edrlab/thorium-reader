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
    IOpdsAuthView, IOpdsCoverView, IOpdsFeedMetadataView, IOpdsFeedView, IOpdsGroupView,
    IOpdsLinkView, IOpdsNavigationLink, IOpdsNavigationLinkView, IOPDSPropertiesView,
    IOpdsPublicationView, IOpdsResultView, IOpdsTagView,
} from "readium-desktop/common/views/opds";
import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { ContentType } from "readium-desktop/utils/contentType";

import { IWithAdditionalJSON, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { OPDSAvailabilityEnum } from "@r2-opds-js/opds/opds2/opds2-availability";
import { OPDSFacet } from "@r2-opds-js/opds/opds2/opds2-facet";
import { OPDSGroup } from "@r2-opds-js/opds/opds2/opds2-group";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSCurrencyEnum } from "@r2-opds-js/opds/opds2/opds2-price";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Subject } from "@r2-shared-js/models/metadata-subject";

import { IOpdsContributorView, IOpdsFacetView } from "../../common/views/opds";
import { fallback } from "./tools/fallback";
import { filterRelLink, filterTypeLink } from "./tools/filterLink";
import { urlPathResolve } from "./tools/resolveUrl";
import { TLinkMayBeOpds, TProperties } from "./type/link.type";
import { ILinkFilter } from "./type/linkFilter.interface";

// Logger
const debug = debug_("readium-desktop:main/converter/opds");
debug("opds-converter");

const supportedFileTypeLinkArray = [
    ContentType.AudioBookPacked,
    ContentType.AudioBookPackedLcp,
    ContentType.Epub,
    ContentType.Lcp,
    ContentType.AudioBook,
    ContentType.webpub,
    ContentType.webpubPacked,
    ContentType.Json,
    ContentType.JsonLd,
    ContentType.pdf,
    ContentType.lcppdf,
];

@injectable()
export class OpdsFeedViewConverter {

    public convertDocumentToView(document: OpdsFeedDocument): IOpdsFeedView {
        return {
            identifier: document.identifier, // preserve Identifiable identifier
            title: document.title,
            url: document.url,
        };
    }

    public convertOpdsNavigationLinkToView(link: OPDSLink, baseUrl: string): IOpdsNavigationLinkView {
        // Title could be defined on multiple lines
        // Only keep the first one
        const titleParts = link.Title?.split("\n").filter((text) => text);
        const title = titleParts[0]?.trim();
        const subtitle = titleParts[1]?.trim();

        return {
            title,
            subtitle,
            url: urlPathResolve(baseUrl, link.Href),
            numberOfItems: link.Properties && link.Properties.NumberOfItems,
        };
    }

    public convertOpdsPropertiesToView(properties: TProperties | undefined): IOPDSPropertiesView {

        if (properties) {

            const key = "lcp_hashed_passphrase";
            const lcpHashedPassphraseObj = properties.AdditionalJSON ? properties.AdditionalJSON[key] : undefined;
            let lcpHashedPassphrase: string;
            if (typeof lcpHashedPassphraseObj === "string") {
                const lcpHashedPassphraseHexOrB64 = lcpHashedPassphraseObj as string;
                let isHex = false;
                try {
                    const low1 = lcpHashedPassphraseHexOrB64.toLowerCase();
                    const buff = Buffer.from(low1, "hex");
                    const str = buff.toString("hex");
                    const low2 = str.toLowerCase();
                    isHex = low1 === low2;
                    if (!isHex) {
                        debug(`OPDS lcp_hashed_passphrase should be HEX! (${lcpHashedPassphraseHexOrB64}) ${low1} !== ${low2}`);
                    } else {
                        debug(`OPDS lcp_hashed_passphrase is HEX: ${lcpHashedPassphraseHexOrB64}`);
                    }
                } catch (err) {
                    debug(err); // ignore
                }
                if (isHex) {
                    lcpHashedPassphrase = lcpHashedPassphraseHexOrB64;
                } else {
                    let isBase64 = false;
                    try {
                        const buff = Buffer.from(lcpHashedPassphraseHexOrB64, "base64");
                        const str = buff.toString("hex");
                        const b64 = Buffer.from(str, "hex").toString("base64");
                        isBase64 = lcpHashedPassphraseHexOrB64 === b64;
                        if (!isBase64) {
                            debug(`OPDS lcp_hashed_passphrase is not BASE64?! (${lcpHashedPassphraseHexOrB64}) ${lcpHashedPassphraseHexOrB64} !== ${b64}`);
                        } else {
                            debug(`OPDS lcp_hashed_passphrase is BASE64! (${lcpHashedPassphraseHexOrB64})`);
                        }
                    } catch (err) {
                        debug(err); // ignore
                    }
                    if (isBase64) {
                        lcpHashedPassphrase = Buffer.from(lcpHashedPassphraseHexOrB64, "base64").toString("hex");
                    }
                }
            }

            const indirectAcquisitions = properties.IndirectAcquisitions ?
                (Array.isArray(properties.IndirectAcquisitions) ?
                    properties.IndirectAcquisitions : [properties.IndirectAcquisitions]) :
                undefined;

            return {
                indirectAcquisitionType: indirectAcquisitions?.reduce<string>((pv, cv) => {
                    return typeof cv?.TypeAcquisition === "string" ? cv.TypeAcquisition : pv;
                }, undefined),
                lcpHashedPassphrase,
                numberOfItems: properties.NumberOfItems || undefined,
                priceValue: properties.Price?.Value || undefined,
                priceCurrency: properties.Price?.Currency as OPDSCurrencyEnum || undefined,
                holdTotal: properties.Holds?.Total || undefined,
                holdPosition: properties.Holds?.Position || undefined,
                copyTotal: properties.Copies?.Total || undefined,
                copyAvailable: properties.Copies?.Available || undefined,
                availabilityState: properties.Availability?.State as OPDSAvailabilityEnum || undefined,
                availabilitySince: properties.Availability?.Since
                    && moment(properties.Availability.Since).toISOString() || undefined,
                availabilityUntil: properties.Availability?.Until
                    && moment(properties.Availability.Until).toISOString() || undefined,
            };
        }
        return undefined;
    }

    public convertOpdsTagToView(subject: Subject, baseUrl: string): IOpdsTagView | undefined {

        return (subject.Name || subject.Code) ? {
            name: convertMultiLangStringToString(subject.Name || subject.Code),
            link: this.convertFilterLinkToView(baseUrl, subject.Links || [], {
                type: [
                    ContentType.AtomXml,
                    ContentType.Opds2,
                ],
            }),
        } : undefined;
    }

    public convertOpdsContributorToView(contributor: Contributor, baseUrl: string): IOpdsContributorView | undefined {

        return (contributor.Name) ? {
            name: typeof contributor.Name === "object"
                ? convertMultiLangStringToString(contributor.Name)
                : contributor.Name,
            link: this.convertFilterLinkToView(baseUrl, contributor.Links || [], {
                type: [
                    ContentType.AtomXml,
                    ContentType.Opds2,
                ],
            }),
        } : undefined;
    }

    public convertLinkToView(
        links: TLinkMayBeOpds[] | undefined,
        baseUrl: string,
    ): IOpdsLinkView[] {

        // transform to absolute url
        links?.forEach(
            (ln) =>
                ln.Href = urlPathResolve(baseUrl, ln.Href));

        // safe copy on each filtered links
        const formatedLinks: IOpdsLinkView[] = [];
        links?.forEach(
            (ln) =>
                formatedLinks.push({
                    url: ln.Href,
                    title: ln.Title,
                    type: ln.TypeLink,
                    properties: this.convertOpdsPropertiesToView(ln.Properties),
                }),
        );

        return formatedLinks;
    }

    public convertFilterLinkToView(
        baseUrl: string,
        links: TLinkMayBeOpds[] | undefined,
        filter: ILinkFilter,
    ): IOpdsLinkView[] {

        const linksFiltered = links?.filter(
            (ln) => {

                if (!ln.Href &&
                    (ln as unknown as IWithAdditionalJSON).AdditionalJSON?.link &&
                    typeof ((ln as unknown as IWithAdditionalJSON).AdditionalJSON?.link) === "string") {

                    // yep, error in OPDS feed, "link" instead of "href"
                    ln.Href = (ln as unknown as IWithAdditionalJSON).AdditionalJSON.link as string;
                    debug(`OPDS LINK MONKEY PATCH: ${ln.Href}`);
                }

                let relFlag = false;
                let typeFlag = false;

                if (ln.Href) {
                    relFlag = filterRelLink(ln, filter);
                    typeFlag = filterTypeLink(ln, filter);
                }

                return (
                    (filter.type && filter.rel)
                        ? (relFlag && typeFlag)
                        : (relFlag || typeFlag)
                );
            },
        );

        return this.convertLinkToView(linksFiltered, baseUrl);
    }

    // warning: modifies r2OpdsPublication, makes relative URLs absolute with baseUrl!
    public convertOpdsPublicationToView(r2OpdsPublication: OPDSPublication, baseUrl: string): IOpdsPublicationView {

        const metadata = r2OpdsPublication.Metadata;

        const numberOfPages = metadata.NumberOfPages;
        const workIdentifier = metadata.Identifier;
        const description = metadata.Description;
        const languages = metadata.Language;
        const title = convertMultiLangStringToString(metadata.Title);
        const publishedAt = metadata.PublicationDate &&
            moment(metadata.PublicationDate).toISOString();

        const authors = metadata.Author?.map(
            (author) =>
                this.convertOpdsContributorToView(author, baseUrl)).filter((v) => v);

        const publishers = metadata.Publisher?.map(
            (publisher) =>
                this.convertOpdsContributorToView(publisher, baseUrl)).filter((v) => v);

        const tags = metadata.Subject?.map(
            (subject) =>
                this.convertOpdsTagToView(subject, baseUrl)).filter((v) => v);

        // CoverView object
        const coverLinkView = this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Images, {
            rel: "http://opds-spec.org/image",
        });

        const thumbnailLinkView = fallback(
            this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Images, {
                type: ["image/png", "image/jpeg"],
                rel: "http://opds-spec.org/image/thumbnail",
            }),
            this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Images, {
                type: ["image/png", "image/jpeg"],
            }),
            this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Images, {
                type: new RegExp("^image\/*"),
            }),
        );

        let cover: IOpdsCoverView | undefined;
        if (thumbnailLinkView) {
            cover = {
                thumbnailLinks: thumbnailLinkView,
                coverLinks: coverLinkView,
            };
        }

        // Get opds entry
        const sampleLinkView = this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
            rel: [
                "http://opds-spec.org/acquisition/sample",
                "http://opds-spec.org/acquisition/preview",
            ],
            type: supportedFileTypeLinkArray,
        });
        const acquisitionLinkView = this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
            rel: [
                "http://opds-spec.org/acquisition",
                "http://opds-spec.org/acquisition/open-access",
            ],
            type: supportedFileTypeLinkArray,
        });
        const buyLinkView = this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/buy",
        });
        const borrowLinkView = this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/borrow",
        });
        const subscribeLinkView = this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/subscribe",
        });
        const entrylinkView = fallback(
            this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
                type: "type=entry;profile=opds-catalog",
                rel: "alternate",
            }),
            this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
                type: ContentType.Opds2Pub,
                rel: "self",
            }),
            this.convertFilterLinkToView(baseUrl, r2OpdsPublication.Links, {
                type: [
                    ContentType.AtomXml,
                    ContentType.Opds2,
                ],
            }),
        );

        const r2OpdsPublicationJson = TaJsonSerialize(r2OpdsPublication);
        const r2OpdsPublicationStr = JSON.stringify(r2OpdsPublicationJson);
        const r2OpdsPublicationBase64 = Buffer.from(r2OpdsPublicationStr).toString("base64");

        return {
            baseUrl,
            r2OpdsPublicationBase64,
            title,
            authors,
            publishers,
            workIdentifier,
            numberOfPages,
            description,
            tags,
            languages,
            publishedAt,
            cover,
            entryLinks: entrylinkView,
            buyLinks: buyLinkView,
            borrowLinks: borrowLinkView,
            subscribeLinks: subscribeLinkView,
            sampleOrPreviewLinks: sampleLinkView,
            openAccessLinks: acquisitionLinkView,
        };
    }
    public convertOpdsAuthToView(r2OpdsAuth: OPDSAuthenticationDoc, baseUrl: string): IOpdsResultView {
        const title = r2OpdsAuth.Title;
        let logoImageUrl: string | undefined;

        const logoLink = r2OpdsAuth.Links.find(
            (l) =>
                l.Rel && l.Rel.includes("logo"));

        if (logoLink) {
            logoImageUrl = urlPathResolve(baseUrl, logoLink.Href);
        }

        const oauth = r2OpdsAuth.Authentication.find(
            (a) =>
                a.Type === "http://opds-spec.org/auth/oauth/password");

        let labelLogin: string | undefined;
        let labelPassword: string | undefined;
        let oauthUrl: string | undefined;
        let oauthRefreshUrl: string | undefined;
        if (oauth) {
            if (oauth.Labels) {
                labelLogin = oauth.Labels.Login;
                labelPassword = oauth.Labels.Password;
            }
            if (oauth.Links) {
                const oauthLink = oauth.Links.find(
                    (l) =>
                        l.Rel && l.Rel.includes("authenticate"));
                if (oauthLink) {
                    oauthUrl = urlPathResolve(baseUrl, oauthLink.Href);
                }

                const oauthRefreshLink = oauth.Links.find(
                    (l) =>
                        l.Rel && l.Rel.includes("refresh"));
                if (oauthRefreshLink) {
                    oauthRefreshUrl = urlPathResolve(baseUrl, oauthRefreshLink.Href);
                }
            }
        }
        const auth: IOpdsAuthView = {
            logoImageUrl,

            labelLogin,
            labelPassword,

            oauthUrl,
            oauthRefreshUrl,
        };
        return {
            title,
            metadata: undefined,
            publications: undefined,
            navigation: undefined,
            links: undefined,
            groups: undefined,
            auth,
        };
    }

    public convertOpdsGroupToView(r2OpdsGroup: OPDSGroup, baseUrl: string): IOpdsGroupView {
        const title = r2OpdsGroup.Metadata?.Title
            ? convertMultiLangStringToString(r2OpdsGroup.Metadata.Title)
            : "";

        const publications = r2OpdsGroup.Publications?.map(
            (item) =>
                // warning: modifies item, makes relative URLs absolute with baseUrl!
                this.convertOpdsPublicationToView(item, baseUrl));

        const navigation = r2OpdsGroup.Navigation?.map(
            (item) =>
                this.convertOpdsNavigationLinkToView(item, baseUrl));

        const ret: IOpdsGroupView = {
            title,
            publications,
            navigation,
        };
        return ret;
    }

    public convertOpdsFacetsToView(r2OpdsFacet: OPDSFacet, baseUrl: string): IOpdsFacetView {
        const title = r2OpdsFacet.Metadata?.Title
            ? convertMultiLangStringToString(r2OpdsFacet.Metadata.Title)
            : "";

        const links = r2OpdsFacet.Links?.map(
            (item) =>
                this.convertOpdsNavigationLinkToView(item, baseUrl));

        const ret: IOpdsFacetView = {
            title,
            links,
        };
        return ret;
    }

    public convertOpdsFeedToView(r2OpdsFeed: OPDSFeed, baseUrl: string): IOpdsResultView {

        const title = convertMultiLangStringToString(r2OpdsFeed.Metadata?.Title);
        const publications = r2OpdsFeed.Publications?.map(
            (item) =>
                // warning: modifies item, makes relative URLs absolute with baseUrl!
                this.convertOpdsPublicationToView(item, baseUrl));
        const navigation = r2OpdsFeed.Navigation?.map(
            (item) =>
                this.convertOpdsNavigationLinkToView(item, baseUrl));

        const groups = r2OpdsFeed.Groups?.map(
            (item) =>
                this.convertOpdsGroupToView(item, baseUrl));

        const facets = r2OpdsFeed.Facets?.map(
            (item) =>
                this.convertOpdsFacetsToView(item, baseUrl));

        const links: IOpdsNavigationLink | undefined = r2OpdsFeed.Links &&
        {
            next: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "next" }),
            previous: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "previous" }),
            first: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "first" }),
            last: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "last" }),
            start: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "start" }),
            up: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "up" }),
            search: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "search" }),
            bookshelf: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "http://opds-spec.org/shelf" }),
            text: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { type: [ContentType.Html] }),
            self: this.convertFilterLinkToView(baseUrl, r2OpdsFeed.Links, { rel: "self" }),
        };
        const metadata: IOpdsFeedMetadataView | undefined = r2OpdsFeed.Metadata &&
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
            groups,
            facets,
            auth: undefined,
        };
    }
}
