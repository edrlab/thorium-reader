// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { OpdsFeed } from "readium-desktop/common/models/opds";
<<<<<<< HEAD
import { AccessTokenMap } from "readium-desktop/common/redux/states/catalog";
import { httpGet } from "readium-desktop/common/utils/http";
import { OpdsFeedView, THttpGetOpdsResultView } from "readium-desktop/common/views/opds";
=======
import {
    IOpdsFeedView, IOpdsLinkView, IOpdsPublicationView, THttpGetOpdsPublicationView,
    THttpGetOpdsResultView,
} from "readium-desktop/common/views/opds";
>>>>>>> develop
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
<<<<<<< HEAD
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import { RootState } from "readium-desktop/main/redux/states";
import { Store } from "redux";
import * as request from "request";
import * as xmldom from "xmldom";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { convertOpds1ToOpds2 } from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
=======
import { OpdsService } from "readium-desktop/main/services/opds";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
>>>>>>> develop

// Logger
const debug = debug_("readium-desktop:src/main/api/opds");

export interface IOpdsApi {
<<<<<<< HEAD
    getFeed: (identifier: string) => Promise<OpdsFeedView>;
    deleteFeed: (identifier: string) => Promise<void>;
    findAllFeeds: () => Promise<OpdsFeedView[]>;
    addFeed: (data: OpdsFeed) => Promise<OpdsFeedView>;
    updateFeed: (data: OpdsFeed) => Promise<OpdsFeedView>;
    browse: (url: string) => Promise<THttpGetOpdsResultView>;
    // tslint:disable-next-line: max-line-length
    oauth: (opdsUrl: string, login: string, password: string, oAuthUrl: string, oAuthRefreshUrl: string | undefined, OPDS_AUTH_ENCRYPTION_KEY_HEX: string, OPDS_AUTH_ENCRYPTION_IV_HEX: string, refreshToken?: string) => Promise<boolean>;
=======
    getFeed: (
        identifier: string,
    ) => Promise<IOpdsFeedView>;
    deleteFeed: (
        identifier: string,
    ) => Promise<void>;
    findAllFeeds: (
    ) => Promise<IOpdsFeedView[]>;
    addFeed: (
        data: OpdsFeed,
    ) => Promise<IOpdsFeedView>;
    updateFeed: (
        data: OpdsFeed,
    ) => Promise<IOpdsFeedView>;
    browse: (
        url: string,
    ) => Promise<THttpGetOpdsResultView>;
    getPublicationFromEntry: (
        url: string,
    ) => Promise<THttpGetOpdsPublicationView>;
    getUrlWithSearchLinks: (
        searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch,
    ) => Promise<string | undefined>;
>>>>>>> develop
}

export type TOpdsApiGetFeed = IOpdsApi["getFeed"];
export type TOpdsApiDeleteFeed = IOpdsApi["deleteFeed"];
export type TOpdsApiFindAllFeed = IOpdsApi["findAllFeeds"];
export type TOpdsApiAddFeed = IOpdsApi["addFeed"];
export type TOpdsApiUpdateFeed = IOpdsApi["updateFeed"];
export type TOpdsApiBrowse = IOpdsApi["browse"];
<<<<<<< HEAD
export type TOpdsApiOAuth = IOpdsApi["oauth"];
=======
export type TOpdsApiGetPublicationFromEntry = IOpdsApi["getPublicationFromEntry"];
export type TOpdsApiGetUrlWithSearchLinks = IOpdsApi["getUrlWithSearchLinks"];
>>>>>>> develop

export type TOpdsApiGetFeed_result = IOpdsFeedView;
export type TOpdsApiDeleteFeed_result = void;
export type TOpdsApiFindAllFeed_result = IOpdsFeedView[];
export type TOpdsApiAddFeed_result = IOpdsFeedView;
export type TOpdsApiUpdateFeed_result = IOpdsFeedView;
export type TOpdsApiBrowse_result = THttpGetOpdsResultView;
<<<<<<< HEAD
export type TOpdsApiOAuth_result = boolean;
=======
export type TOpdsApiGetPublicationFromEntry_result = THttpGetOpdsPublicationView;
export type TOpdsApiGetUrlWithSearchLink_result = ReturnPromiseType<IOpdsApi["getUrlWithSearchLinks"]>;
>>>>>>> develop

export interface IOpdsModuleApi {
    "opds/getFeed": TOpdsApiGetFeed;
    "opds/deleteFeed": TOpdsApiDeleteFeed;
    "opds/findAllFeeds": TOpdsApiFindAllFeed;
    "opds/addFeed": TOpdsApiAddFeed;
    "opds/updateFeed": TOpdsApiUpdateFeed;
    "opds/browse": TOpdsApiBrowse;
<<<<<<< HEAD
    "opds/oauth": TOpdsApiOAuth;
=======
    "opds/getPublicationFromEntry": TOpdsApiGetPublicationFromEntry;
    "opds/getUrlWithSearchLinks": TOpdsApiGetUrlWithSearchLinks;
>>>>>>> develop
}

type TOpdsLinkSearch = Required<Pick<IOpdsLinkView, "url" | "type">>;

const checkUrl = (url: string) => {
    try {
        if (new URL(url).protocol === "opds:") {
            url = url.replace("opds://", "http://");
        }
    } catch (e) {
        throw new Error(`opds-api-url-invalid ${e.message}`);
    }
    return url;
};

@injectable()
export class OpdsApi implements IOpdsApi {

    @inject(diSymbolTable["opds-feed-repository"])
    private readonly opdsFeedRepository!: OpdsFeedRepository;

    @inject(diSymbolTable["opds-feed-view-converter"])
    private readonly opdsFeedViewConverter!: OpdsFeedViewConverter;

<<<<<<< HEAD
    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    @inject(diSymbolTable["config-repository"])
    private readonly configRepository!: ConfigRepository<AccessTokenMap>;

    // private _OPDS_AUTH_ENCRYPTION_KEY_HEX: string | undefined;
    // private _OPDS_AUTH_ENCRYPTION_IV_HEX: string | undefined;

    public async getFeed(identifier: string): Promise<OpdsFeedView> {
=======
    @inject(diSymbolTable["opds-service"])
    private readonly opdsService!: OpdsService;

    public async getFeed(identifier: string): Promise<IOpdsFeedView> {
>>>>>>> develop
        const doc = await this.opdsFeedRepository.get(identifier);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async deleteFeed(identifier: string): Promise<void> {
        await this.opdsFeedRepository.delete(identifier);
    }

    public async findAllFeeds(): Promise<IOpdsFeedView[]> {
        const docs = await this.opdsFeedRepository.findAll();
        return docs.map((doc) => {
            return this.opdsFeedViewConverter.convertDocumentToView(doc);
        });
    }

    public async addFeed(data: OpdsFeed): Promise<IOpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async updateFeed(data: OpdsFeed): Promise<IOpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

<<<<<<< HEAD
    public async browse(url: string, tryingAgain: boolean = false): Promise<THttpGetOpdsResultView> {
        if (new URL(url).protocol === "opds:") {
            url = url.replace("opds://", "http://");
        }

        let savedAccessTokens: AccessTokenMap = {};
        try {
            const configDoc = await this.configRepository.get("oauth");
            savedAccessTokens = configDoc.value;
        } catch (err) {
            debug(err);
        }

        const domain = url.replace(/^https?:\/\/([^\/]+)\/?.*$/, "$1");
        const accessToken = savedAccessTokens ? savedAccessTokens[domain] : undefined;

        return await httpGet(url, {
            timeout: 10000,
            headers: {
                Authorization: accessToken ? `Bearer ${accessToken.authenticationToken}` : undefined,
            },
        }, async (opdsFeedData) => {

            // let r2OpdsPublication: OPDSPublication = null;
            let r2OpdsFeed: OPDSFeed = null;
            let r2OpdsAuth: OPDSAuthenticationDoc = null;

            const body = opdsFeedData.body;
            if (opdsFeedData.isFailure) {
                if (opdsFeedData.statusCode === 401 && body) {
                    // try parse OPDSAuthenticationDoc
                    // (see below)
                } else {
                    return opdsFeedData;
                }
            }

            debug("opdsFeed content-type", opdsFeedData.contentType);
            if (!OpdsApi.contentTypeisAccepted(opdsFeedData.contentType)) {
                if (opdsFeedData.isFailure) {
                    return opdsFeedData;
                }
                // tslint:disable-next-line: max-line-length
                throw new Error(`Not a valid OPDS HTTP Content-Type for ${opdsFeedData.url} (${opdsFeedData.contentType})`);
            }

            if (body.startsWith("<?xml")) {
                if (opdsFeedData.isFailure) {
                    return opdsFeedData;
                }
                const xmlDom = new xmldom.DOMParser().parseFromString(body);

                if (!xmlDom || !xmlDom.documentElement) {
                    throw new OpdsParsingError(`Unable to parse ${url}`);
                }
=======
    public async getPublicationFromEntry(url: string): Promise<THttpGetOpdsPublicationView> {
        url = checkUrl(url);
>>>>>>> develop

        return await this.opdsService.opdsRequest(url,
            // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
            (r2OpdsFeed) => {
                const opdsFeed = this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url);

                let publication: IOpdsPublicationView;
                if (Array.isArray(opdsFeed.publications)) {
                    publication = opdsFeed.publications[0];
                } else {
                    debug(`publication from ${url} not found`);
                }

<<<<<<< HEAD
                const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
                r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
            } else {
                const jsonObj = JSON.parse(body);

                const tryRefreshAccessToken =
                    // to test / mock access token expiry, comment the next two lines:
                    jsonObj.authentication &&
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
                        return this.browse(url, true); // tryingAgain
                        // uncomment the following to debug-breakpoint more specifically in the promise "cascade"
                        // try {
                        //     const res = await this.browse(url, true); // tryingAgain
                        //     return res;
                        // } catch (err) {
                        //     debug(err);
                        //     throw err; // reject
                        // }
                    }
                }
                if (jsonObj.authentication) { // usually with opdsFeedData.isFailure
                    r2OpdsAuth = TaJsonDeserialize<OPDSAuthenticationDoc>(
                        jsonObj,
                        OPDSAuthenticationDoc,
                    );
                } else {
                    if (opdsFeedData.isFailure) {
                        return opdsFeedData;
                    }
                    r2OpdsFeed = TaJsonDeserialize<OPDSFeed>(
                        jsonObj,
                        OPDSFeed,
                    );
                }
            }

            if (r2OpdsFeed) {
                // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
                opdsFeedData.data = await this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url);
            } else {
                opdsFeedData.data = await this.opdsFeedViewConverter.convertOpdsAuthToView(r2OpdsAuth, url);
            }
=======
                debug("GetPublicationFromEntry return publication =", publication);
                return publication;
            });
    }

    public async browse(url: string): Promise<THttpGetOpdsResultView> {
        url = checkUrl(url);

        return await this.opdsService.opdsRequest(url,
            // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
            (r2OpdsFeed) => this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url));
    }
>>>>>>> develop

    public async getUrlWithSearchLinks(searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch)
        : Promise<string | undefined> {
        const link = Array.isArray(searchLink) ? searchLink : [searchLink];
        return this.opdsService.parseOpdsSearchUrl(link);
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
                "Content-Type": "application/x-www-form-url-encoded",
                "Accept": "application/json,application/xml",
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
                method: "POST",
                uri: oAuthUrl,
            })
                .on("response", success)
                .on("error", failure);
        });
    }
}
