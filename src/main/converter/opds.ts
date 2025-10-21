// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import * as moment from "moment";
import {
    IOpdsAuthView, IOpdsCoverView, IOpdsFeedMetadataView, IOpdsFeedView, IOpdsGroupView,
    IOpdsLinkView, IOpdsNavigationLink, IOpdsNavigationLinkView, IOPDSPropertiesView,
    IOpdsPublicationView, IOpdsResultView, IOpdsTagView,
} from "readium-desktop/common/views/opds";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
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
import { OPDSProperties } from "@r2-opds-js/opds/opds2/opds2-properties";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Subject } from "@r2-shared-js/models/metadata-subject";

import { IOpdsContributorView, IOpdsFacetView } from "../../common/views/opds";
import { fallback } from "./tools/fallback";
import { filterRelLink, filterTypeLink } from "./tools/filterLink";
import { urlPathResolve } from "./tools/resolveUrl";
import { TLinkMayBeOpds, TProperties } from "./type/link.type";
import { ILinkFilter } from "./type/linkFilter.interface";
import { diSymbolTable } from "../diSymbolTable";
import { type Store } from "redux";
import { RootState } from "../redux/states";
import { PublicationRepository } from "../db/repository/publication";
import { getAuthenticationToken } from "../network/http";

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
    ContentType.Lpf,
    ContentType.Zip,

    ContentType.Html, // https://github.com/edrlab/thorium-reader/issues/2208
    ContentType.Xhtml,
];

@injectable()
export class OpdsFeedViewConverter {

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["publication-repository"])
    private readonly publicationRepository!: PublicationRepository;

    // @inject(diSymbolTable["opds-service"])
    // private readonly opdsService!: OpdsService;

    public async convertDocumentToView(document: OpdsFeedDocument): Promise<IOpdsFeedView> {

        let authentified: boolean = undefined;

        const feedUrl = document.url;
        let catalogLinkUrl: URL;
        try {

            if (feedUrl.startsWith("apiapp://")) {
                if (feedUrl.startsWith("apiapp://")) {
                    const urlApiapp = feedUrl.slice("apiapp://".length);
                    const [idGln, urlLib] = urlApiapp.split(":apiapp:");

                    debug("APIAPP");
                    debug("ID_GNL=", idGln);
                    debug("URL_LIB=", urlLib);
                    if (urlLib) {
                        catalogLinkUrl = (new URL(urlLib));
                        catalogLinkUrl.host = `apiapploans.org.edrlab.thoriumreader.break.${idGln}.break.${catalogLinkUrl.host}`;
                    }
                }
            } else {

                catalogLinkUrl = (new URL(feedUrl));
            }

        } catch (e) {
            debug(e);
        }
        if (catalogLinkUrl) {
            const authToken = await getAuthenticationToken(catalogLinkUrl);
            if (authToken?.accessToken) {
                debug("catalog authentified: ", catalogLinkUrl.host);
                authentified = true;
            } else {
                debug("catalog NOT authentified: ", catalogLinkUrl.host, authToken);
            }
        } else {
            debug("No catalogLinkUrl found, return");
        }

        // let's trigger the same event as customization profile catalog
        // const feedHasAuthenticationFunction = async () => {
        //     try {
        //         const response = await httpGetWithAuth(false)(document.url);
        //         const opdsService = diMainGet("opds-service"); // circular-reference issue
        //         const opdsView = await opdsService.opdsRequestTransformer(response);
        //         if (!opdsView) {
        //             const bookshelf = opdsView.links?.bookshelf;
        //             if (bookshelf?.length) {
        //                 if (bookshelf[0].url) {
        //                     const bookshelfUrl = bookshelf[0].url;
        //                     const response = await httpGetWithAuth(false)(bookshelfUrl);
        //                     const mimeType = parseContentType(response.contentType);
        //                     if (contentTypeisOpdsAuth(mimeType)) {
        //                         return true;
        //                     }
        //                 }
        //             }
        //         }
        //     } catch {
        //         // ignore
        //     }
        //     return false;
        // }

        return {
            identifier: document.identifier, // preserve Identifiable identifier
            title: document.title,
            url: document.url,
            authentified: authentified,
            authenticationUrl: document.authenticationUrl,
            // feedHasAuthentication: authentified || await feedHasAuthenticationFunction(),
        };
    }

    public convertOpdsNavigationLinkToView(link: OPDSLink, baseUrl: string): IOpdsNavigationLinkView {
        const title = link.Title || "";
        const summary = link.Properties?.AdditionalJSON ? link.Properties.AdditionalJSON["title_summary"] : undefined;
        const subtitle = summary as string || "";

        return {
            title,
            subtitle,
            url: urlPathResolve(baseUrl, link.Href),
            numberOfItems: link.Properties && link.Properties.NumberOfItems,
        };
    }

    public convertOpdsPropertiesToView(properties: TProperties | undefined): IOPDSPropertiesView | undefined {

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
                indirectAcquisitionTypes: indirectAcquisitions?.reduce<{ top: string, child: string | undefined} | undefined>((pv, cv) => {
                    if (typeof cv?.TypeAcquisition === "string") {
                        const child = cv.Children?.reduce<string | undefined>((pv_, cv_) => {
                            return typeof cv_?.TypeAcquisition === "string" ? cv_.TypeAcquisition : pv_;
                        }, undefined);
                        return {
                            top: cv.TypeAcquisition,
                            child,
                        };
                    } else {
                        return pv;
                    }
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
            name: convertMultiLangStringToString(subject.Name || subject.Code, this.store.getState().i18n.locale),
            link: this.convertFilterLinksToView(baseUrl, subject.Links || [], {
                type: [
                    ContentType.AtomXml,
                    ContentType.Opds2,
                ],
            }),
        } : undefined;
    }

    public convertOpdsContributorToView(contributor: Contributor, baseUrl: string): IOpdsContributorView | undefined {

        return (contributor.Name) ? {
            nameLangString: contributor.Name,
            link: this.convertFilterLinksToView(baseUrl, contributor.Links || [], {
                type: [
                    ContentType.AtomXml,
                    ContentType.Opds2,
                ],
            }),
        } : undefined;
    }

    public convertLinkToView(
        ln: TLinkMayBeOpds | undefined,
        baseUrl: string,
    ): IOpdsLinkView {

        // transform to absolute url
        ln.Href = urlPathResolve(baseUrl, ln.Href);
        // safe copy on each filtered links
        return {
            url: ln.Href,
            title: ln.Title,
            type: ln.TypeLink,
            properties: this.convertOpdsPropertiesToView(ln.Properties),
            rel: ln.Rel && ln.Rel.length > 0 ? ln.Rel[0] : undefined,
        };
    }

    public filterLinks(
        links: TLinkMayBeOpds[] | undefined,
        filter: ILinkFilter,
    ): TLinkMayBeOpds[] {

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

        return linksFiltered || [];
    }
    public convertFilterLinksToView(
        baseUrl: string,
        links: TLinkMayBeOpds[] | undefined,
        filter: ILinkFilter,
    ): IOpdsLinkView[] {

        const lns = this.filterLinks(links, filter);
        const view = lns.map(
            (item) =>
                this.convertLinkToView(item, baseUrl),
        );

        return view;
    }

    // warning: modifies r2OpdsPublication, makes relative URLs absolute with baseUrl!
    public convertOpdsPublicationToView(r2OpdsPublication: OPDSPublication, baseUrl: string): IOpdsPublicationView {

        const metadata = r2OpdsPublication.Metadata;

        const numberOfPages = metadata.NumberOfPages;
        const workIdentifier = metadata.Identifier;
        const description = metadata.Description;
        const languages = metadata.Language;

        const title = convertMultiLangStringToString(metadata.Title, this.store.getState().i18n.locale);
        // console.log(`=-=-==-=-${JSON.stringify(metadata.Title)}---${title}`);

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
        const coverLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Images, {
            rel: "http://opds-spec.org/image",
        });

        const thumbnailLinkView = fallback(
            this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Images, {
                type: ["image/png", "image/jpeg"],
                rel: "http://opds-spec.org/image/thumbnail",
            }),
            this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Images, {
                type: ["image/png", "image/jpeg"],
            }),
            this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Images, {
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


        const selfLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            rel: "self",
            type: "application/opds-publication+json",
        });
        const selfLinkUrl = selfLinkView.length === 1 ? selfLinkView[0].url : undefined;


        const attachLocalBookshelfPubId = (opdsLinkView: IOpdsLinkView) => {
            const { url, type } = opdsLinkView;
            const pubs = this.publicationRepository.findByOpdsPublication(url, type, workIdentifier, selfLinkUrl);
            if (pubs.length > 1) {
                debug("attachLocalBookshelf on ", opdsLinkView);
                debug("too many publications !!!", "attached to", workIdentifier, selfLinkUrl);
                debug(pubs);
            } else if (pubs.length) {
                opdsLinkView.localBookshelfPublicationId = pubs[0].identifier;
            }
            return opdsLinkView;
        };

        // Get opds entry
        const sampleLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            rel: [
                "http://opds-spec.org/acquisition/sample",
                "http://opds-spec.org/acquisition/preview",
            ],
            type: supportedFileTypeLinkArray,
        }).map(attachLocalBookshelfPubId);

        const acquisitionLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            rel: [
                "http://opds-spec.org/acquisition",
                "http://opds-spec.org/acquisition/open-access",
            ],
            type: supportedFileTypeLinkArray,
        }).map(attachLocalBookshelfPubId);

        const buyLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/buy",
            type: supportedFileTypeLinkArray, // https://github.com/edrlab/thorium-reader/issues/3032
        }).map(attachLocalBookshelfPubId);

        const borrowLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/borrow",
            type: supportedFileTypeLinkArray, // https://github.com/edrlab/thorium-reader/issues/3032
        }).map(attachLocalBookshelfPubId);

        const subscribeLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            rel: "http://opds-spec.org/acquisition/subscribe",
            type: supportedFileTypeLinkArray, // https://github.com/edrlab/thorium-reader/issues/3032
        });
        const entrylinkView = fallback(
            this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
                type: "type=entry;profile=opds-catalog",
                rel: "alternate",
            }),
            this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
                type: ContentType.Opds2Pub,
                rel: "self",
            }),
            // this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            //     type: [
            //         ContentType.AtomXml,
            //         ContentType.Opds2,
            //     ],
            // }),
        );
        const catalogLinkView = fallback(
            this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
                type: ["application/atom+xml;profile=opds-catalog;kind=acquisition", ContentType.Opds2],
                rel: "http://opds-spec.org/catalog",
            }),
            // this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            //     type: [
            //         ContentType.AtomXml,
            //         ContentType.Opds2,
            //     ],
            // }),
        );

        const revokeLoanLinkView = this.convertFilterLinksToView(baseUrl, r2OpdsPublication.Links, {
            rel: ["http://librarysimplified.org/terms/rel/revoke"],
        });

        // const r2OpdsPublicationJson = TaJsonSerialize(r2OpdsPublication);
        // Legacy Base64 data blobs
        // const r2OpdsPublicationStr = JSON.stringify(r2OpdsPublicationJson);
        // const r2OpdsPublicationBase64 = Buffer.from(r2OpdsPublicationStr).toString("base64");

        const duration = typeof r2OpdsPublication.Metadata.Duration === "number" ? r2OpdsPublication.Metadata.Duration : undefined;
        const nbOfTracks = typeof r2OpdsPublication.Metadata.AdditionalJSON?.tracks === "number" ? r2OpdsPublication.Metadata.AdditionalJSON?.tracks : undefined;

        return {
            baseUrl,
            // r2OpdsPublicationJson,
            documentTitle: title,
            authorsLangString: authors,
            publishersLangString: publishers,
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
            revokeLoanLinks: revokeLoanLinkView,
            duration,
            nbOfTracks,
            catalogLinkView,

            // legacy vs. modern a11y metadata structure
            a11y_accessMode: r2OpdsPublication.Metadata.Accessibility?.AccessMode || r2OpdsPublication.Metadata.AccessMode, // string[]
            a11y_accessibilityFeature: r2OpdsPublication.Metadata.Accessibility?.Feature || r2OpdsPublication.Metadata.AccessibilityFeature, // string[]
            a11y_accessibilityHazard: r2OpdsPublication.Metadata.Accessibility?.Hazard || r2OpdsPublication.Metadata.AccessibilityHazard, // string[]

            a11y_certifiedBy: r2OpdsPublication.Metadata.Accessibility?.Certification?.CertifiedBy || r2OpdsPublication.Metadata.CertifiedBy, // string[]
            a11y_certifierCredential: r2OpdsPublication.Metadata.Accessibility?.Certification?.Credential || r2OpdsPublication.Metadata.CertifierCredential, // string[]
            a11y_certifierReport: r2OpdsPublication.Metadata.Accessibility?.Certification?.Report || r2OpdsPublication.Metadata.CertifierReport, // string[]
            a11y_conformsTo: r2OpdsPublication.Metadata.Accessibility?.ConformsTo || r2OpdsPublication.Metadata.ConformsTo, // string[]

            a11y_accessModeSufficient: r2OpdsPublication.Metadata.Accessibility?.AccessModeSufficient || r2OpdsPublication.Metadata.AccessModeSufficient, // (string[])[]

            // convertMultiLangStringToLangString()
            a11y_accessibilitySummary: r2OpdsPublication.Metadata.Accessibility?.Summary || r2OpdsPublication.Metadata.AccessibilitySummary, // string | IStringMap

            opdsPublicationStringified: JSON.stringify(TaJsonSerialize(r2OpdsPublication)), // NOTE: This is not a idempotent json serialization from the original json , strict comparaison between json response request will not be equal to this !
            selfLink: selfLinkView.length === 1 ? selfLinkView[0] : undefined,
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
        const publications = r2OpdsGroup.Publications?.map(
            (item) =>
                // warning: modifies item, makes relative URLs absolute with baseUrl!
                this.convertOpdsPublicationToView(item, baseUrl));

        const navigation = r2OpdsGroup.Navigation?.map(
            (item) =>
                this.convertOpdsNavigationLinkToView(item, baseUrl),
        );

        const [lnFiltered] = this.filterLinks(r2OpdsGroup.Links, {
            rel: "self",
        });

        const title = r2OpdsGroup.Metadata?.Title
            ? convertMultiLangStringToString(r2OpdsGroup.Metadata.Title, this.store.getState().i18n.locale)
            : "";

        const nb = r2OpdsGroup.Metadata?.NumberOfItems;

        const selfLink = new OPDSLink();
        selfLink.Title = title;
        selfLink.Properties = new OPDSProperties();
        selfLink.Properties.NumberOfItems = nb;
        selfLink.Rel = lnFiltered?.Rel || undefined;
        selfLink.Href = lnFiltered?.Href || undefined;

        const ret: IOpdsGroupView = {
            publications,
            navigation,
            selfLink: this.convertOpdsNavigationLinkToView(selfLink, baseUrl),
        };
        return ret;
    }

    public convertOpdsFacetsToView(r2OpdsFacet: OPDSFacet, baseUrl: string): IOpdsFacetView {
        const title = r2OpdsFacet.Metadata?.Title
            ? convertMultiLangStringToString(r2OpdsFacet.Metadata.Title, this.store.getState().i18n.locale)
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

        const title = convertMultiLangStringToString(r2OpdsFeed.Metadata?.Title, this.store.getState().i18n.locale);
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

        const links: IOpdsNavigationLink | undefined = r2OpdsFeed.Links
            ? {
                next: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "next" }),
                previous: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "previous" }),
                first: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "first" }),
                last: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "last" }),
                start: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "start" }),
                up: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "up" }),
                search: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "search" }),
                bookshelf: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "http://opds-spec.org/shelf" }),
                text: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { type: [ContentType.Html] }),
                self: this.convertFilterLinksToView(baseUrl, r2OpdsFeed.Links, { rel: "self" }),
            }
            : undefined;
        const metadata: IOpdsFeedMetadataView | undefined = r2OpdsFeed.Metadata
            ? {
                numberOfItems: typeof r2OpdsFeed.Metadata.NumberOfItems === "number" &&
                    r2OpdsFeed.Metadata.NumberOfItems,
                itemsPerPage: typeof r2OpdsFeed.Metadata.ItemsPerPage === "number" &&
                    r2OpdsFeed.Metadata.ItemsPerPage,
                currentPage: typeof r2OpdsFeed.Metadata.CurrentPage === "number" &&
                    r2OpdsFeed.Metadata.CurrentPage,
            }
            : undefined;
        const catalogs = r2OpdsFeed.Catalogs?.map(
            (item) =>
                this.convertOpdsPublicationToView(item, baseUrl));

        return {
            title,
            metadata,
            publications,
            navigation,
            links,
            groups,
            facets,
            auth: undefined,
            catalogs,
        };
    }
}
