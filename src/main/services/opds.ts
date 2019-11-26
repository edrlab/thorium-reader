// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { injectable } from "inversify";
import { httpGet, IHttpGetResult } from "readium-desktop/common/utils/http";
import { IOpdsLinkView, IOpdsResultView } from "readium-desktop/common/views/opds";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import * as xmldom from "xmldom";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { convertOpds1ToOpds2 } from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

// Logger
const debug = debug_("readium-desktop:main#services/catalog");

const SEARCH_TERM = "{searchTerms}";

const findLink = (ln: IOpdsLinkView[], type: string) => ln && ln.find((link) =>
    link.type?.includes(type));

@injectable()
export class OpdsService {
    /**
     * test all possible content-type for both xml and json
     * @param contentType content-type headers
     * @returns if content-Type is missing accept
     */
    private static contentTypeisAccepted(contentType?: string) {
        return this.contentTypeisOpds(contentType) || this.contentTypeisXml(contentType);
    }

    private static contentTypeisXml(contentType?: string) {
        return contentType
            && (contentType.startsWith("application/atom+xml")
            || contentType.startsWith("application/xml")
            || contentType.startsWith("text/xml"));
    }

    private static contentTypeisOpds(contentType?: string) {
        return contentType
            && (contentType.startsWith("application/json")
            || contentType.startsWith("application/opds+json"));
    }

    private static async getOpenSearchUrl(opensearchLink: IOpdsLinkView): Promise<string | undefined> {
        const searchResult = await httpGet(opensearchLink.url, {}, (searchData) => {
            if (searchData.isFailure) {
                searchData.data = undefined;
            }
            searchData.data = searchData.body;
            return searchData;
        });
        return searchResult.data;
    }

    public async opdsRequest<T extends IOpdsResultView>(
        url: string,
        converter: (r2OpdsFeed: OPDSFeed) => T)
        : Promise<IHttpGetResult<string, T>> {
        return httpGet(url, {
            timeout: 10000,
        }, (opdsFeedData) => {
            // let r2OpdsPublication: OPDSPublication = null;
            let r2OpdsFeed: OPDSFeed = null;

            if (opdsFeedData.isFailure) {
                return opdsFeedData;
            }

            debug("opdsFeed content-type", opdsFeedData.contentType);
            if (!OpdsService.contentTypeisAccepted(opdsFeedData.contentType)) {
                // tslint:disable-next-line: max-line-length
                throw new Error(`Not a valid OPDS HTTP Content-Type for ${opdsFeedData.url} (${opdsFeedData.contentType})`);
            }

            const contentType = opdsFeedData.contentType;
            if (OpdsService.contentTypeisXml(contentType)) {
                const xmlDom = new xmldom.DOMParser().parseFromString(opdsFeedData.body);

                if (!xmlDom || !xmlDom.documentElement) {
                    throw new OpdsParsingError(`Unable to parse ${url}`);
                }

                const isEntry = xmlDom.documentElement.localName === "entry";
                if (isEntry) {
                    throw new OpdsParsingError(`This is an OPDS entry ${url}`);
                }

                const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
                r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
            } else {
                r2OpdsFeed = TaJsonDeserialize<OPDSFeed>(
                    JSON.parse(opdsFeedData.body),
                    OPDSFeed,
                );
            }
            opdsFeedData.data = converter(r2OpdsFeed);

            return opdsFeedData;
        });
    }

    public async parseOpdsSearchUrl(link: IOpdsLinkView[]): Promise<string | undefined> {

        debug("opds search links receive", link);

        // find search type before parsing url
        const atomLink = findLink(link, "application/atom+xml");
        const opensearchLink = !atomLink && findLink(link, "application/opensearchdescription+xml");
        const opdsLink = !opensearchLink && findLink(link, "application/opds+json");

        try {
            // http://examples.net/opds/search.php?q={searchTerms}
            if (atomLink && atomLink.url) {
                const url = new URL(atomLink.url);
                if (url.search.includes(SEARCH_TERM) || url.pathname.includes(SEARCH_TERM)) {
                    return (atomLink.url);
                }

                // http://static.wolnelektury.pl/opensearch.xml
            } else if (opensearchLink && opensearchLink.url) {
                return (await OpdsService.getOpenSearchUrl(opensearchLink));

                // https://catalog.feedbooks.com/search.json{?query}
            } else if (opdsLink && opdsLink.url) {
                const url = new URL(opdsLink.url);
                if (url.pathname.endsWith("%7B") && url.search.includes("query")) {
                    return (opdsLink.url.split("{")[0].concat("?query={searchTerms}"));
                }
            }
        } catch {
            // ignore
        }
        return (undefined);
    }
}
