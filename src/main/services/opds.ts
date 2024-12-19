// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { removeUTF8BOM } from "readium-desktop/common/utils/bom";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { tryDecodeURIComponent } from "readium-desktop/common/utils/uri";
import { IOpdsLinkView, IOpdsResultView, OPDS_OPEN_SEARCH_DATA_SEPARATOR } from "readium-desktop/common/views/opds";
import { httpGet } from "readium-desktop/main/network/http";
import {
    ContentType, contentTypeisOpds, contentTypeisOpdsAuth, contentTypeisXml, parseContentType,
} from "readium-desktop/utils/contentType";
import * as URITemplate from "urijs/src/URITemplate";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import {
    convertOpds1ToOpds2, convertOpds1ToOpds2_EntryToPublication,
} from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSAuthentication } from "@r2-opds-js/opds/opds2/opds2-authentication";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { OPDSAuthenticationLabels } from "@r2-opds-js/opds/opds2/opds2-authentication-labels";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
import * as xmldom from "@xmldom/xmldom";

import { OpdsFeedViewConverter } from "../converter/opds";
import { diSymbolTable } from "../diSymbolTable";
import { getOpdsAuthenticationChannel } from "../event";
import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { IDigestDataParsed, parseDigestString } from "readium-desktop/utils/digest";
import { diMainGet } from "../di";
import { importFromLinkService } from "../redux/sagas/api/publication/import/importFromLink";

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
        return searchResult.data ? `${opensearchLink.url}${OPDS_OPEN_SEARCH_DATA_SEPARATOR}${searchResult.data}` : undefined;
    }

    @inject(diSymbolTable["opds-feed-view-converter"])
    private readonly opdsFeedViewConverter!: OpdsFeedViewConverter;

    private parseWwwAuthenticate(wwwAuthenticate: string): IDigestDataParsed & {type: "digest" | "basic" | undefined} {
        const [type, ...data] = wwwAuthenticate.trim().split(" ");
        return {
            type: type === "Digest" ? "digest" : type === "Basic" ? "basic" : undefined,
            ...parseDigestString(data.join(" ")),
        };
    }

    public async opdsRequestTransformer(httpGetData: IHttpGetResult<IOpdsResultView>): Promise<IOpdsResultView | undefined> {

        const {
            url: _baseUrl,
            responseUrl,
            contentType: _contentType,
        } = httpGetData;
        const baseUrl = `${_baseUrl}`;
        const contentType = parseContentType(_contentType); 

       if (contentTypeisXml(contentType)) {

            // TODO: response.buffer deprecated by node-fetch
            const buffer = await httpGetData.response.buffer();
            const result = await this.opdsRequestXmlTransformer(buffer, baseUrl);

            if (result) {
                return result;
            }
        }
        if (contentTypeisOpds(contentType)) {

            const json = await httpGetData.response.json();
            const result = await this.opdsRequestJsonTransformer(json, contentType, responseUrl, baseUrl);

            if (result) {
                return result;
            }
        }

        {
            const wwwAuthenticate = httpGetData.response?.headers.get("WWW-Authenticate");
            if (wwwAuthenticate) {
                const isValid = this.wwwAuthenticateIsValid(wwwAuthenticate);
                if (isValid) {
                    const result: IOpdsResultView = {
                        title: "Unauthorized",
                        publications: [],
                    }; // need to refresh the page

                    const data = this.parseWwwAuthenticate(wwwAuthenticate);
                    if (!data.type) {
                        result.title = `Unauthorized (unsupported WWWAuthenticate type '${wwwAuthenticate?.trim().split(" ")[0]}')`;
                        return result;
                    }

                    this.sendWwwAuthenticationToAuthenticationProcess(data, responseUrl);
                    return result;
                }
            }
        }

        // TODO:
        // now sample and open access pub acquisition will be handled like an opds feed
        // with a download fallback if it is not parsable to an opds format
        // What it means that a misconfigured or rotten opds feed can download anything to the user disk
        // I suggest a user confirmation dialog modal to accept the download of the target link if legit

        // To implement this need to switch to redux saga to ask and wait response in saga mode

        // For the moment let's user download without confirmation

        const downloadLink: IOpdsLinkView = {
            url: _baseUrl.toString(),
            type: contentType,
        };

        const sagaMiddleware = diMainGet("saga-middleware");
        sagaMiddleware.run(importFromLinkService, downloadLink);

        // https://github.com/edrlab/thorium-reader/issues/1261
        // publication in OPDS2 feed might be an OPDSPublication or an R2Publication
        // now downloaded and packaged in importFromLinkService saga function !


        // TODO: what return when the publication is not an opds feed, we have to close the current publication info and reload the previous history odps link !?!


        // TODO: What return here, when we have to reload the history previous link instead !?!
        return undefined;
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

                const url = new URL(atomLink.url.replace(/%7B/g, "{").replace(/%7D/g, "}"));
                debug("parseOpdsSearchUrl", atomLink.url, url.search, url.pathname);

                if (url.search.includes(SEARCH_TERM) ||
                    // url.hash.includes(SEARCH_TERM) ||
                    tryDecodeURIComponent(url.pathname).includes(SEARCH_TERM)) {

                    const urlDecoded = atomLink.url.replace(/%7B/g, "{").replace(/%7D/g, "}");

                    debug("parseOpdsSearchUrl (atomLink): ", urlDecoded);
                    return urlDecoded;
                }

                // http://static.wolnelektury.pl/opensearch.xml
            } else if (opensearchLink?.url) {

                debug("parseOpdsSearchUrl (opensearchLink): ", opensearchLink);
                return (await OpdsService.getOpenSearchUrl(opensearchLink));

                // https://catalog.feedbooks.com/search.json{?query}
            } else if (opdsLink?.url) {

                debug("parseOpdsSearchUrl (opdsLink) 1: ", opdsLink);

                const uriTemplate = new URITemplate(opdsLink.url.replace(/%7B/g, "{").replace(/%7D/g, "}"));
                const uriExpanded = uriTemplate.expand({ query: "\{searchTerms\}" });
                const url = uriExpanded.toString().replace(/%7B/g, "{").replace(/%7D/g, "}");

                debug("parseOpdsSearchUrl (opdsLink) 2: ", url);
                return url;
            }
        } catch (ee) {
            debug("parseOpdsSearchUrl (ERROR): ", ee);
        }
        return (undefined);
    }

    private sendWwwAuthenticationToAuthenticationProcess(
        data: IDigestDataParsed & {type: "digest" | "basic"},
        responseUrl: string,
    ) {

        const opdsAuthDoc = new OPDSAuthenticationDoc();

        opdsAuthDoc.Id = "";
        opdsAuthDoc.Title = ""; // realm || "basic authenticate"; NOT HUMAN-READABLE!

        const opdsAuth = new OPDSAuthentication();

        opdsAuth.Type = "http://opds-spec.org/auth/" + data.type;
        opdsAuth.AdditionalJSON = {...data};
        opdsAuth.Labels = new OPDSAuthenticationLabels();
        opdsAuth.Labels.Login = "LOGIN";
        opdsAuth.Labels.Password = "PASSWORD";

        const opdsLink = new OPDSLink();
        opdsLink.Rel = ["authenticate"];
        opdsLink.Href = responseUrl;

        opdsAuth.Links = [opdsLink];

        opdsAuthDoc.Authentication = [opdsAuth];

        this.dispatchAuthenticationProcess(opdsAuthDoc, responseUrl);
    }

    private wwwAuthenticateIsValid(wwwAuthenticate: string) {
        return (wwwAuthenticate.trim().startsWith("Basic") || wwwAuthenticate.trim().startsWith("Digest"));
    }

    private dispatchAuthenticationProcess(r2OpdsAuth: OPDSAuthenticationDoc, responseUrl: string) {

        const opdsAuthChannel = getOpdsAuthenticationChannel();

        debug("put the authentication model in the saga authChannel", JSON.stringify(r2OpdsAuth, null, 4));
        opdsAuthChannel.put([r2OpdsAuth, responseUrl]);

    }

    private async opdsRequestJsonTransformer(
        jsonObj: any,
        contentType: ContentType,
        responseUrl: string,
        baseUrl: string = responseUrl,
    ): Promise<IOpdsResultView | undefined> {

        const isOpdsPub = contentType === ContentType.Opds2Pub ||
            jsonObj.metadata &&
            // jsonObj.links &&
            !!(!jsonObj.publications &&
                !jsonObj.navigation &&
                !jsonObj.groups &&
                !jsonObj.catalogs);

        const isAuth = contentTypeisOpdsAuth(contentType) ||
            typeof jsonObj.authentication !== "undefined";

        const isFeed = contentType === ContentType.Opds2 ||
            !!(jsonObj.publications ||
                jsonObj.navigation ||
                jsonObj.groups ||
                jsonObj.catalogs);

        debug("isAuth, isOpdsPub, isR2Pub, isFeed", isAuth, isOpdsPub, isFeed);
        // debug(jsonObj);
        // console.log(JSON.stringify(jsonObj, null, 4));
        if (isAuth) {
            const r2OpdsAuth = TaJsonDeserialize(
                jsonObj,
                OPDSAuthenticationDoc,
            );

            this.dispatchAuthenticationProcess(r2OpdsAuth, responseUrl);

            return {
                title: "Unauthorized",
                publications: [],
            }; // need to refresh the page

        } else if (isOpdsPub) {
            const r2OpdsPublication = TaJsonDeserialize(
                jsonObj,
                OPDSPublication,
            );
            const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(r2OpdsPublication, baseUrl);
            return {
                title: pubView.documentTitle,
                publications: [pubView],
            };

        }  else if (isFeed) {
            const r2OpdsFeed = TaJsonDeserialize(
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

        const str = removeUTF8BOM(buffer.toString());
        const xmlDom = new xmldom.DOMParser().parseFromString(str, "application/xml");

        if (!xmlDom || !xmlDom.documentElement) {
            debug(`Unable to parse ${baseUrl}`);
            return undefined;
        }

        const isEntry = xmlDom.documentElement.localName === "entry";
        if (isEntry) {
            // It's a single publication entry and not an OpdsFeed

            const opds1Entry = XML.deserialize<Entry>(xmlDom as unknown as Document, Entry);
            const r2OpdsPublication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
            const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(
                r2OpdsPublication,
                baseUrl,
            );
            return {
                title: pubView.documentTitle,
                publications: [pubView],
            } as IOpdsResultView;

        }

        const opds1Feed = XML.deserialize<OPDS>(xmlDom as unknown as Document, OPDS);
        const r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
        return this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, baseUrl);
    }
}
