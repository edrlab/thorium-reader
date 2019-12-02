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
import { httpGet } from "readium-desktop/common/utils/http";
import { OpdsFeedView, THttpGetOpdsResultView } from "readium-desktop/common/views/opds";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import { opdsActions } from "readium-desktop/main/redux/actions";
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

// Logger
const debug = debug_("readium-desktop:src/main/api/opds");

export interface IOpdsApi {
    getFeed: (identifier: string) => Promise<OpdsFeedView>;
    deleteFeed: (identifier: string) => Promise<void>;
    findAllFeeds: () => Promise<OpdsFeedView[]>;
    addFeed: (data: OpdsFeed) => Promise<OpdsFeedView>;
    updateFeed: (data: OpdsFeed) => Promise<OpdsFeedView>;
    browse: (url: string) => Promise<THttpGetOpdsResultView>;
    // tslint:disable-next-line: max-line-length
    oauth: (opdsUrl: string, login: string, password: string, oAuthUrl: string, oAuthRefreshUrl: string, OPDS_AUTH_ENCRYPTION_KEY_HEX: string, OPDS_AUTH_ENCRYPTION_IV_HEX: string) => Promise<boolean>;
}

export type TOpdsApiGetFeed = IOpdsApi["getFeed"];
export type TOpdsApiDeleteFeed = IOpdsApi["deleteFeed"];
export type TOpdsApiFindAllFeed = IOpdsApi["findAllFeeds"];
export type TOpdsApiAddFeed = IOpdsApi["addFeed"];
export type TOpdsApiUpdateFeed = IOpdsApi["updateFeed"];
export type TOpdsApiBrowse = IOpdsApi["browse"];
export type TOpdsApiOAuth = IOpdsApi["oauth"];

export type TOpdsApiGetFeed_result = OpdsFeedView;
export type TOpdsApiDeleteFeed_result = void;
export type TOpdsApiFindAllFeed_result = OpdsFeedView[];
export type TOpdsApiAddFeed_result = OpdsFeedView;
export type TOpdsApiUpdateFeed_result = OpdsFeedView;
export type TOpdsApiBrowse_result = THttpGetOpdsResultView;
export type TOpdsApiOAuth_result = boolean;

export interface IOpdsModuleApi {
    "opds/getFeed": TOpdsApiGetFeed;
    "opds/deleteFeed": TOpdsApiDeleteFeed;
    "opds/findAllFeeds": TOpdsApiFindAllFeed;
    "opds/addFeed": TOpdsApiAddFeed;
    "opds/updateFeed": TOpdsApiUpdateFeed;
    "opds/browse": TOpdsApiBrowse;
    "opds/oauth": TOpdsApiOAuth;
}

@injectable()
export class OpdsApi implements IOpdsApi {

    /**
     * test all possible content-type for both xml and json
     * @param contentType content-type headers
     * @returns if content-Type is missing accept
     */
    public static contentTypeisAccepted(contentType?: string) {
        const retBool = contentType &&
            !contentType.startsWith("application/json") &&
            !contentType.startsWith("application/opds+json") &&
            !contentType.startsWith("application/atom+xml") &&
            !contentType.startsWith("application/xml") &&
            !contentType.startsWith("text/xml");
        return !retBool;
    }

    @inject(diSymbolTable["opds-feed-repository"])
    private readonly opdsFeedRepository!: OpdsFeedRepository;

    @inject(diSymbolTable["opds-feed-view-converter"])
    private readonly opdsFeedViewConverter!: OpdsFeedViewConverter;

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    public async getFeed(identifier: string): Promise<OpdsFeedView> {
        const doc = await this.opdsFeedRepository.get(identifier);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async deleteFeed(identifier: string): Promise<void> {
        await this.opdsFeedRepository.delete(identifier);
    }

    public async findAllFeeds(): Promise<OpdsFeedView[]> {
        const docs = await this.opdsFeedRepository.findAll();
        return docs.map((doc) => {
            return this.opdsFeedViewConverter.convertDocumentToView(doc);
        });
    }

    public async addFeed(data: OpdsFeed): Promise<OpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async updateFeed(data: OpdsFeed): Promise<OpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async browse(url: string): Promise<THttpGetOpdsResultView> {
        if (new URL(url).protocol === "opds:") {
            url = url.replace("opds://", "http://");
        }

        const accessTokens = this.store.getState().catalog?.accessTokens;
        const domain = url.replace(/^https?:\/\/([^\/]+)\/?.*$/, "$1");
        const accessToken = accessTokens ? accessTokens[domain] : undefined;

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

                const isEntry = xmlDom.documentElement.localName === "entry";
                if (isEntry) {
                    throw new OpdsParsingError(`This is an OPDS entry ${url}`);
                }

                const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
                r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
            } else {
                const jsonObj = JSON.parse(body);
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

            return opdsFeedData;
        });
    }

    // tslint:disable-next-line: max-line-length
    public async oauth(
        opdsUrl: string,
        login: string,
        passwordEncrypted: string,
        oAuthUrl: string,
        _oAuthRefreshUrl: string,
        OPDS_AUTH_ENCRYPTION_KEY_HEX: string,
        OPDS_AUTH_ENCRYPTION_IV_HEX: string): Promise<boolean> {

        const encrypted = Buffer.from(passwordEncrypted, "base64"); // .toString("utf8");
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
        const password = decrypted.slice(0, size).toString("utf8");

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
                    this.store.dispatch(opdsActions.accessToken.build(
                        domain,
                        responseJson.access_token,
                        responseJson.refresh_token));
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
                form: {
                    grant_type: "password",
                    username: login,
                    password,
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
