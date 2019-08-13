// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";

import * as moment from "moment";

import {
    OpdsFeedView,
    OpdsLinkView,
    OpdsPublicationView,
    OpdsResultType,
    OpdsResultView,
} from "readium-desktop/common/views/opds";

import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";

import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";

import { httpGet } from "readium-desktop/common/utils/http";
import * as convert from "xml-js";

import {
    convertContributorArrayToStringArray,
    convertMultiLangStringToString,
} from "readium-desktop/common/utils";

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
            publicationCount: (link.Children) ? link.Children.length : null,
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

        let publishedAt = null;

        if (metadata.PublicationDate) {
            publishedAt = moment(metadata.PublicationDate).toISOString();
        }

        let cover = null;

        if (publication.Images && publication.Images.length > 0) {
            cover = {
                url: publication.Images[0].Href,
            };
        }

        // Get odps entry
        let url = null;
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
            hasSample: sampleUrl && true,
            base64OpdsPublication,
            isFree,
        };
    }

    public async convertOpdsFeedToView(feed: OPDSFeed): Promise<OpdsResultView> {
        const title = convertMultiLangStringToString(feed.Metadata.Title);
        let type = OpdsResultType.Empty;
        let navigation = null;
        let publications = null;

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
        }

        return {
            title,
            type,
            publications,
            navigation,
            searchUrl: await this.getSearchUrlFromOpds1Feed(feed),
        };
    }

    private async getSearchUrlFromOpds1Feed(feed: OPDSFeed) {
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
            // ignore
        }
        // if searchUrl is not found return undefined
        // User will be can't use search form
        return searchUrl;
    }
}
