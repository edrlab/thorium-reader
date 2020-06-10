// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { AccessTokenMap } from "readium-desktop/common/redux/states/catalog";
import { httpGet, IHttpGetResult } from "readium-desktop/common/utils/http";
import { IOpdsLinkView, IOpdsResultView } from "readium-desktop/common/views/opds";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import { RootState } from "readium-desktop/main/redux/states";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { ContentType } from "readium-desktop/utils/content-type";
import { Store } from "redux";
import * as request from "request";
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
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

import { OpdsFeedViewConverter } from "../converter/opds";
import { diSymbolTable } from "../diSymbolTable";

// Logger
const debug = debug_("readium-desktop:main#services/catalog");

const SEARCH_TERM = "{searchTerms}";

const findLink = (ln: IOpdsLinkView[], type: string) => ln && ln.find((link) =>
    link.type?.includes(type));

@injectable()
export class OpdsService {

    private static contentTypeisXml(contentType?: string) {
        return contentType
            && (contentType.startsWith(ContentType.AtomXml)
                || contentType.startsWith(ContentType.Xml)
                || contentType.startsWith(ContentType.TextXml));
    }

    private static contentTypeisOpds(contentType?: string) {
        return contentType
            && (contentType.startsWith(ContentType.Json)
                || contentType.startsWith(ContentType.Opds2)
                || contentType.startsWith(ContentType.Opds2Auth)
                || contentType.startsWith(ContentType.Opds2Pub)
            )
        ;
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

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["config-repository"])
    private readonly configRepository!: ConfigRepository<AccessTokenMap>;

    @inject(diSymbolTable["opds-feed-view-converter"])
    private readonly opdsFeedViewConverter!: OpdsFeedViewConverter;

    // private _OPDS_AUTH_ENCRYPTION_KEY_HEX: string | undefined;
    // private _OPDS_AUTH_ENCRYPTION_IV_HEX: string | undefined;

    public async opdsRequest(
        url: string,
        tryingAgain: boolean = false): Promise<IHttpGetResult<string, IOpdsResultView>> {

        let savedAccessTokens: AccessTokenMap = {};
        try {
            const configDoc = await this.configRepository.get("oauth");
            savedAccessTokens = configDoc.value;
        } catch (err) {
            debug("oauth get");
            debug(err);
        }

        const domain = url.replace(/^https?:\/\/([^\/]+)\/?.*$/, "$1");
        const accessToken = savedAccessTokens ? savedAccessTokens[domain] : undefined;

        return httpGet(url, {
            timeout: 10000,
            headers: {
                Authorization: accessToken ? `Bearer ${accessToken.authenticationToken}` : undefined,
            },
        }, async (opdsFeedData) => {

            let r2OpdsFeed: OPDSFeed | undefined;
            let r2OpdsAuth: OPDSAuthenticationDoc | undefined;
            let r2OpdsPublication: OPDSPublication | undefined;

            const body = opdsFeedData.body;
            if (opdsFeedData.isFailure) {
                if (opdsFeedData.statusCode === 401 && body) {
                    // try parse OPDSAuthenticationDoc
                    // (see below)
                } else {
                    return opdsFeedData;
                }
            }

            const contentType = opdsFeedData.contentType;

            if (OpdsService.contentTypeisXml(contentType)) {

                // TODO: parse OPDS1 XML Authentication document
                // note: Feedbooks can be used to test,
                // but not with OAuth bearer token (instead: basic authentication realm)
                if (opdsFeedData.isFailure) {
                    return opdsFeedData;
                }

                const xmlDom = new xmldom.DOMParser().parseFromString(body);

                if (!xmlDom || !xmlDom.documentElement) {
                    throw new OpdsParsingError(`Unable to parse ${url}`);
                }

                const isEntry = xmlDom.documentElement.localName === "entry";
                if (isEntry) {
                    // It's a single publication entry and not an OpdsFeed

                    const opds1Entry = XML.deserialize<Entry>(xmlDom, Entry);
                    r2OpdsPublication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
                } else {

                    const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
                    r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
                }

            } else if (OpdsService.contentTypeisOpds(contentType)) {

                const jsonObj = JSON.parse(body);

                const isPub = contentType.startsWith(ContentType.Opds2Pub) ||
                    (!jsonObj.publications &&
                    !jsonObj.navigation &&
                    !jsonObj.groups &&
                    !jsonObj.catalogs);

                const isAuth = contentType.startsWith(ContentType.Opds2Auth) ||
                    typeof jsonObj.authentication !== "undefined";

                const isFeed = contentType.startsWith(ContentType.Opds2) ||
                    (jsonObj.publications ||
                    jsonObj.navigation ||
                    jsonObj.groups ||
                    jsonObj.catalogs);

                const tryRefreshAccessToken =
                    // to test / mock access token expiry, comment the next two lines:
                    isAuth &&
                    opdsFeedData.isFailure && opdsFeedData.statusCode === 401 &&

                    accessToken && accessToken.refreshToken && accessToken.refreshUrl &&
                    !tryingAgain;
                    // no need to decrypt pass!
                    // && this._OPDS_AUTH_ENCRYPTION_KEY_HEX &&
                    // this._OPDS_AUTH_ENCRYPTION_KEY_HEX ? true : false;

                if (tryRefreshAccessToken) {
                    let doRetry = false;
                    try {
                        await this.oauth(
                            url,
                            undefined,
                            undefined,
                            accessToken.authenticationUrl,
                            accessToken.refreshUrl,
                            undefined, // this._OPDS_AUTH_ENCRYPTION_KEY_HEX, // can be undefined first-time around
                            undefined, // this._OPDS_AUTH_ENCRYPTION_IV_HEX, // can be undefined first-time around
                            accessToken.refreshToken);

                        doRetry = true;
                    } catch (err) {
                        debug(err);
                        // access token refresh failed
                        // =>
                        // continue with auth form
                    }

                    if (doRetry) {
                        return this.opdsRequest(url, true); // tryingAgain
                        // uncomment the following to debug-breakpoint more specifically in the promise "cascade"
                        // try {
                        //     const res = await this.browse(url, converter, converterAuth, true); // tryingAgain
                        //     return res;
                        // } catch (err) {
                        //     debug(err);
                        //     throw err; // reject
                        // }
                    }
                }

                if (isAuth) { // usually with opdsFeedData.isFailure
                    r2OpdsAuth = TaJsonDeserialize<OPDSAuthenticationDoc>(
                        jsonObj,
                        OPDSAuthenticationDoc,
                    );
                } else {
                    if (opdsFeedData.isFailure) {
                        return opdsFeedData;
                    }

                    if (isPub) {
                        r2OpdsPublication = TaJsonDeserialize<OPDSPublication>(
                            jsonObj,
                            OPDSPublication,
                        );
                    } else if (isFeed) {
                        r2OpdsFeed = TaJsonDeserialize<OPDSFeed>(
                            jsonObj,
                            OPDSFeed,
                        );
                    }
                }
            } else {
                if (opdsFeedData.isFailure) {
                    return opdsFeedData;
                }

                debug(`unknown url content-type : ${opdsFeedData.url} - ${contentType}`);
                throw new Error(
                    `Not a valid OPDS HTTP Content-Type for ${opdsFeedData.url} (${contentType})`,
                );
            }

            if (r2OpdsFeed) {
                // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
                opdsFeedData.data = this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url);
            } else if (r2OpdsAuth) {
                opdsFeedData.data = this.opdsFeedViewConverter.convertOpdsAuthToView(r2OpdsAuth, url);
            } else if (r2OpdsPublication) {
                const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(r2OpdsPublication, url);
                opdsFeedData.data = {
                    title: pubView.title,
                    publications: [pubView],
                } as IOpdsResultView;
            }

            return opdsFeedData;
        });
    }

    // tslint:disable-next-line: max-line-length
    public async oauth(
        opdsUrl: string,
        login: string | undefined,
        passwordEncrypted: string | undefined,
        oAuthUrl: string,
        oAuthRefreshUrl: string | undefined,
        OPDS_AUTH_ENCRYPTION_KEY_HEX: string,
        OPDS_AUTH_ENCRYPTION_IV_HEX: string,
        refreshToken?: string): Promise<boolean> {

        // this._OPDS_AUTH_ENCRYPTION_KEY_HEX = OPDS_AUTH_ENCRYPTION_KEY_HEX;
        // this._OPDS_AUTH_ENCRYPTION_IV_HEX = OPDS_AUTH_ENCRYPTION_IV_HEX;

        let password: string | undefined;

        if (passwordEncrypted) {
            const encrypted = Buffer.from(passwordEncrypted, "base64");
            const decrypteds: Buffer[] = [];
            const decryptStream = crypto.createDecipheriv("aes-256-cbc",
                Buffer.from(OPDS_AUTH_ENCRYPTION_KEY_HEX, "hex"),
                Buffer.from(OPDS_AUTH_ENCRYPTION_IV_HEX, "hex"));
            decryptStream.setAutoPadding(false);
            const buff1 = decryptStream.update(encrypted);
            if (buff1) {
                decrypteds.push(buff1);
            }
            const buff2 = decryptStream.final();
            if (buff2) {
                decrypteds.push(buff2);
            }
            const decrypted = Buffer.concat(decrypteds);
            const nPaddingBytes = decrypted[decrypted.length - 1];
            const size = encrypted.length - nPaddingBytes;
            password = decrypted.slice(0, size).toString("utf8");
        }

        return new Promise<boolean>((resolve, reject) => {

            const failure = (err: any) => {
                debug(err);
                reject(err);
            };

            const success = async (response: request.RequestResponse) => {

                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    failure("HTTP CODE " + response.statusCode);
                    return;
                }

                let responseData: Buffer;
                try {
                    responseData = await streamToBufferPromise(response);
                } catch (err) {
                    failure(err);
                    return;
                }
                try {
                    const responseStr = responseData.toString("utf8");
                    const responseJson = JSON.parse(responseStr);
                    // {
                    //     "access_token": "XXX",
                    //     "token_type": "Bearer",
                    //     "expires_in": 3600,
                    //     "refresh_token": "YYYY",
                    //     "created_at": 1574940691
                    // }

                    if (!responseJson.access_token) {
                        failure(responseStr);
                        return;
                    }
                    const domain = opdsUrl.replace(/^https?:\/\/([^\/]+)\/?.*$/, "$1");
                    const domainAccessToken: AccessTokenMap = {};
                    domainAccessToken[domain] = {
                        authenticationUrl: oAuthUrl,
                        authenticationToken: responseJson.access_token,
                        refreshUrl: oAuthRefreshUrl,
                        refreshToken: responseJson.refresh_token,
                    }; // as AccessTokenValue;

                    let savedAccessTokens: AccessTokenMap = {};
                    try {
                        const configDoc = await this.configRepository.get("oauth");
                        savedAccessTokens = configDoc.value;
                    } catch (err) {
                        debug("oauth get");
                        debug(err);
                    }
                    const accessTokens: AccessTokenMap = Object.assign(
                        {},
                        savedAccessTokens,
                        domainAccessToken,
                    );
                    try {
                        await this.configRepository.save({
                            identifier: "oauth",
                            value: accessTokens,
                        });
                    } catch (err) {
                        debug("oauth save");
                        debug(err);
                    }

                    resolve(true);
                } catch (err) {
                    failure(err);
                }
            };

            const locale = this.store.getState().i18n.locale;
            const headers = {
                "user-agent": "readium-desktop",
                "accept-language": `${locale},en-US;q=0.7,en;q=0.5`,
                "Content-Type": ContentType.FormUrlEncoded,
                "Accept": `${ContentType.Json},${ContentType.Xml}`,
            };
            request.post({
                form: login && password ? {
                    grant_type: "password",
                    username: login,
                    password,
                } : {
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                },
                headers,
                agentOptions: {
                    rejectUnauthorized: IS_DEV ? false : true,
                },
                method: "POST",
                uri: oAuthUrl,
            })
                .on("response", success)
                .on("error", failure);
        });
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
}
