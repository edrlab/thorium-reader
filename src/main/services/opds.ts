// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as crypto from "crypto";
import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { OPDSAuthentication } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication";
import {
    OPDSAuthenticationLabels,
} from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication-labels";
import {
    IOpdsLinkView, IOpdsResultView, THttpGetOpdsResultView,
} from "readium-desktop/common/views/opds";
import { httpGet } from "readium-desktop/main/network/http";
// import { RootState } from "readium-desktop/main/redux/states";
// import { IS_DEV } from "readium-desktop/preprocessor-directives";
import {
    ContentType, contentTypeisOpds, contentTypeisXml, parseContentType,
} from "readium-desktop/utils/contentType";
// import { Store } from "redux";
// import * as request from "request";
import * as URITemplate from "urijs/src/URITemplate";
import * as xmldom from "xmldom";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import {
    convertOpds1ToOpds2, convertOpds1ToOpds2_EntryToPublication,
} from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
// import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

import { OpdsFeedViewConverter } from "../converter/opds";
import { diSymbolTable } from "../diSymbolTable";
import { getOpdsAuthenticationChannel } from "../event";

// Logger
const debug = debug_("readium-desktop:main#services/opds");

const SEARCH_TERM = "{searchTerms}";

const findLink = (ln: IOpdsLinkView[], type: string) => ln && ln.find((link) =>
    link.type?.includes(type));

@injectable()
export class OpdsService {

    private static async getOpenSearchUrl(opensearchLink: IOpdsLinkView): Promise<string | undefined> {
        const searchResult = await httpGet<string>(
            opensearchLink.url,
            {
                // timeout: 10000,
            },
            async (searchData) => {
                if (searchData.isFailure) {
                    searchData.data = undefined;
                }
                const buf = await searchData.response.buffer();
                searchData.data = buf.toString();
                return searchData;
            });
        return searchResult.data;
    }

    @inject(diSymbolTable["opds-feed-view-converter"])
    private readonly opdsFeedViewConverter!: OpdsFeedViewConverter;

    public async opdsRequest(url: string): Promise<THttpGetOpdsResultView> {

        const result = httpGet<IOpdsResultView>(
            url,
            undefined, // options
            async (opdsFeedData) => {

                const { url: _baseUrl, responseUrl, contentType: _contentType } = opdsFeedData;
                const baseUrl = `${_baseUrl}`;
                const contentType = parseContentType(_contentType);

                if (contentTypeisXml(contentType)) {

                    const buffer = await opdsFeedData.response.buffer();
                    opdsFeedData.data = await this.opdsRequestXmlTransformer(buffer, baseUrl);

                    if (opdsFeedData.data) {
                        return opdsFeedData;
                    }
                }
                if (contentTypeisOpds(contentType)) {

                    const json = await opdsFeedData.response.json();
                    opdsFeedData.data = await this.opdsRequestJsonTransformer(json, contentType, responseUrl, baseUrl);

                    if (opdsFeedData.data) {
                        return opdsFeedData;
                    }
                }

                {
                    const wwwAuthenticate = opdsFeedData.response.headers.get("WWW-Authenticate");
                    if (wwwAuthenticate) {
                        const realm = this.getRealmInWwwAuthenticateInHeader(wwwAuthenticate);
                        if (realm) {
                            this.sendWwwAuthenticationToAuthenticationProcess(realm, responseUrl);

                            opdsFeedData.data = {
                                title: "Unauthorized",
                                publications: [],
                            }; // need to refresh the page
                            return opdsFeedData;
                        }
                    }
                }

                debug(`unknown url content-type : ${baseUrl} - ${contentType}`);
                throw new Error(
                    `Not a valid OPDS HTTP Content-Type for ${baseUrl}} (${contentType})`,
                );
            },
        );

        return result;
    }

    public async parseOpdsSearchUrl(link: IOpdsLinkView[]): Promise<string | undefined> {

        debug("opds search links receive", link);

        // find search type before parsing url
        const atomLink = findLink(link, ContentType.AtomXml);
        const opensearchLink = !atomLink && findLink(link, ContentType.OpenSearch);
        const opdsLink = !opensearchLink && findLink(link, ContentType.Opds2);

        try {
            // http://examples.net/opds/search.php?q={searchTerms}
            if (atomLink?.url) {
                const url = new URL(atomLink.url);
                if (url.search.includes(SEARCH_TERM) || url.pathname.includes(SEARCH_TERM)) {
                    return (atomLink.url);
                }

                // http://static.wolnelektury.pl/opensearch.xml
            } else if (opensearchLink?.url) {
                return (await OpdsService.getOpenSearchUrl(opensearchLink));

                // https://catalog.feedbooks.com/search.json{?query}
            } else if (opdsLink?.url) {

                const uriTemplate = new URITemplate(opdsLink.url);
                const uriExpanded = uriTemplate.expand({ query: "\{searchTerms\}" });
                const url = uriExpanded.toString().replace("%7B", "{").replace("%7D", "}");

                return url;
            }
        } catch {
            // ignore
        }
        return (undefined);
    }

    private sendWwwAuthenticationToAuthenticationProcess(
        realm: string,
        responseUrl: string,
    ) {

        const opdsAuthDoc = new OPDSAuthenticationDoc();

        opdsAuthDoc.Id = "";
        opdsAuthDoc.Title = realm || "basic authenticate";

        const opdsAuth = new OPDSAuthentication();

        opdsAuth.Type = "http://opds-spec.org/auth/basic";
        opdsAuth.Labels = new OPDSAuthenticationLabels();
        opdsAuth.Labels.Login = "LOGIN";
        opdsAuth.Labels.Password = "PASSWORD";

        opdsAuthDoc.Authentication = [opdsAuth];

        this.dispatchAuthenticationProcess(opdsAuthDoc, responseUrl);
    }

    private getRealmInWwwAuthenticateInHeader(
        wwwAuthenticate: string | undefined,
    ) {
        if (typeof wwwAuthenticate === "string") {

            debug("wwwAuthenticate", wwwAuthenticate);
            const [type] = wwwAuthenticate.trim().split(" ");

            debug("type", type);

            if (type === "Basic") {
                const data = wwwAuthenticate.slice("Basic ".length);
                const dataSplit = data.split(",");
                const dataRealm = dataSplit.find((v) => v.trim().startsWith("realm")).trim();
                if (dataRealm) {
                    const [, ...value] = dataRealm.split("\"");
                    const realm = (value || []).join();
                    debug("realm", realm);
                    return realm || "Login";
                }

            } else {

                debug("not a Basic authentication in WWW-authenticate");
            }
        }

        return undefined;
    }

    private dispatchAuthenticationProcess(r2OpdsAuth: OPDSAuthenticationDoc, responseUrl: string) {

        const opdsAuthChannel = getOpdsAuthenticationChannel();

        debug("put the authentication model in the saga authChannel", r2OpdsAuth);
        opdsAuthChannel.put([r2OpdsAuth, responseUrl]);

    }

    private async opdsRequestJsonTransformer(
        jsonObj: any,
        contentType: ContentType,
        responseUrl: string,
        baseUrl: string = responseUrl,
    ): Promise<IOpdsResultView | undefined> {

        const isPub = contentType === ContentType.Opds2Pub ||
            jsonObj.metadata &&
            jsonObj["@context"] &&
            !!(!jsonObj.publications &&
                !jsonObj.navigation &&
                !jsonObj.groups &&
                !jsonObj.catalogs);

        const isAuth = contentType === ContentType.Opds2Auth ||
            typeof jsonObj.authentication !== "undefined";

        const isFeed = contentType === ContentType.Opds2 ||
            !!(jsonObj.publications ||
                jsonObj.navigation ||
                jsonObj.groups ||
                jsonObj.catalogs);

        debug("isAuth, isPub, isFeed", isAuth, isPub, isFeed);

        if (isAuth) {
            const r2OpdsAuth = TaJsonDeserialize<OPDSAuthenticationDoc>(
                jsonObj,
                OPDSAuthenticationDoc,
            );

            this.dispatchAuthenticationProcess(r2OpdsAuth, responseUrl);

            return {
                title: "Unauthorized",
                publications: [],
            }; // need to refresh the page

        } else if (isPub) {
            const r2OpdsPublication = TaJsonDeserialize<OPDSPublication>(
                jsonObj,
                OPDSPublication,
            );
            const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(r2OpdsPublication, baseUrl);
            return {
                title: pubView.title,
                publications: [pubView],
            } as IOpdsResultView;

        } else if (isFeed) {
            const r2OpdsFeed = TaJsonDeserialize<OPDSFeed>(
                jsonObj,
                OPDSFeed,
            );
            return this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, baseUrl);
        }

        return undefined;

    }

    private async opdsRequestXmlTransformer(buffer: Buffer, baseUrl: string) {

        if (!buffer) {
            debug("no data");
            return undefined;
        }
        const xmlDom = new xmldom.DOMParser().parseFromString(buffer.toString());

        if (!xmlDom || !xmlDom.documentElement) {
            debug(`Unable to parse ${baseUrl}`);
            return undefined;
        }

        const isEntry = xmlDom.documentElement.localName === "entry";
        if (isEntry) {
            // It's a single publication entry and not an OpdsFeed

            const opds1Entry = XML.deserialize<Entry>(xmlDom, Entry);
            const r2OpdsPublication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
            const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(
                r2OpdsPublication,
                baseUrl,
            );
            return {
                title: pubView.title,
                publications: [pubView],
            } as IOpdsResultView;

        }

        const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
        const r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
        return this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, baseUrl);
    }
}
