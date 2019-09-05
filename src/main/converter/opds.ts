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
    OpdsFeedView, OpdsLinkView, OpdsPublicationView, OpdsResultType, OpdsResultView,
} from "readium-desktop/common/views/opds";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { resolve } from "url";
import * as convert from "xml-js";

import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

// Logger
const debug = debug_("readium-desktop:main#services/lcp");

import { CoverView } from "readium-desktop/common/views/publication";

@injectable()
export class OpdsFeedViewConverter {
    public convertDocumentToView(document: OpdsFeedDocument): OpdsFeedView {
        return {
            identifier: document.identifier,
            title: document.title,
            url: document.url,
        };
    }

    public convertOpdsLinkToView(link: OPDSLink): OpdsLinkView {
        // Title could be defined on multiple lines
        // Only keep the first one
        let title = link.Title;
        const titleParts = title.split("\n");
        title = titleParts[0];

        return  {
            title,
            url: link.Href,
            publicationCount: (link.Children) ? link.Children.length : undefined,
        };
    }

    public convertOpdsPublicationToView(publication: OPDSPublication): OpdsPublicationView {
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

        let cover: CoverView | undefined;

        if (publication.Images && publication.Images.length > 0) {
            cover = {
                url: publication.Images[0].Href,
            };
        }

        // Get odps entry
        let url: string | undefined;
        let sampleUrl: string | undefined;
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

        let base64OpdsPublication: string | undefined;
        if (links.length > 0) {
            url = links[0].Href;
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
            url,
            buyUrl: buyLink && buyLink.Href,
            borrowUrl: borrowLink && borrowLink.Href,
            subscribeUrl: subscribeLink && subscribeLink.Href,
            hasSample: (typeof sampleUrl !== "undefined") && true,
            base64OpdsPublication,
            isFree,
        };
    }

    public async convertOpdsFeedToView(feed: OPDSFeed, url: string): Promise<OpdsResultView> {
        const title = convertMultiLangStringToString(feed.Metadata.Title);
        let type = OpdsResultType.Empty;
        let navigation: OpdsLinkView[] | undefined;
        let publications: OpdsPublicationView[] | undefined;

        if (feed.Publications) {
            // result page containing publications
            type = OpdsResultType.PublicationFeed;
            publications = feed.Publications.map((item) => {
                return this.convertOpdsPublicationToView(item);
            });
        } else if (feed.Navigation) {
            // result page containing navigation
            type = OpdsResultType.NavigationFeed;
            navigation = feed.Navigation.map((item) => {
                return this.convertOpdsLinkToView(item);
            });

            // concatenate all relative path to an absolute URL path
            navigation = navigation.map((nav) => {
                if (nav.url && !/^https?:\/\//.exec(nav.url)) {
                    nav.url = resolve(url, nav.url);
                }
                return nav;
            });
        }

        return {
            title,
            type,
            publications,
            navigation,
            searchUrl: await this.getSearchUrlFromOpds1Feed(feed),
        };
    }

    private async getSearchUrlFromOpds1Feed(feed: OPDSFeed): Promise<string| undefined> {
        // https://github.com/readium/readium-desktop/issues/296#issuecomment-502134459

        let searchUrl: string | undefined;
        try {
            if (feed.Links) {
                const searchLink = feed.Links.find((value) => value.Rel[0] === "search");
                if (searchLink.TypeLink === "application/opds+json") {
                    searchUrl = searchLink.Href;
                } else {
                    const searchLinkFeedData = await httpGet(searchLink.Href);
                    if (searchLinkFeedData.isFailure) {
                        return undefined;
                    }
                    const result = convert.xml2js(searchLinkFeedData.data, { compact: true }) as convert.ElementCompact;

                    if (result) {
                        const doc = result.OpenSearchDescription;
                        searchUrl = doc.Url.find((value: any) => {
                            return value._attributes && value._attributes.type === "application/atom+xml";
                        })._attributes.template;
                    }
                }
            }
        } catch (e) {
            debug("getSearchUrlFromOpds1Feed", e);
        }
        // if searchUrl is not found return undefined
        // User will be can't use search form
        return searchUrl;
    }
}
