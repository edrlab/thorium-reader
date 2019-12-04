// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import {
    OPDSAuthenticationDoc,
} from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication-doc";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import {
    IOpdsFeedView, IOpdsLinkView, IOpdsPublicationView, THttpGetOpdsPublicationView,
    THttpGetOpdsResultView,
} from "readium-desktop/common/views/opds";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { OpdsService } from "readium-desktop/main/services/opds";
import { ReturnPromiseType } from "readium-desktop/typings/promise";

// Logger
const debug = debug_("readium-desktop:src/main/api/opds");

export interface IOpdsApi {
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
    // tslint:disable-next-line: max-line-length
    oauth: (
        opdsUrl: string,
        login: string | undefined,
        password: string | undefined,
        oAuthUrl: string,
        oAuthRefreshUrl: string | undefined,
        OPDS_AUTH_ENCRYPTION_KEY_HEX: string,
        OPDS_AUTH_ENCRYPTION_IV_HEX: string,
        refreshToken?: string) => Promise<boolean>;
}

export type TOpdsApiGetFeed = IOpdsApi["getFeed"];
export type TOpdsApiDeleteFeed = IOpdsApi["deleteFeed"];
export type TOpdsApiFindAllFeed = IOpdsApi["findAllFeeds"];
export type TOpdsApiAddFeed = IOpdsApi["addFeed"];
export type TOpdsApiUpdateFeed = IOpdsApi["updateFeed"];
export type TOpdsApiBrowse = IOpdsApi["browse"];
export type TOpdsApiGetPublicationFromEntry = IOpdsApi["getPublicationFromEntry"];
export type TOpdsApiGetUrlWithSearchLinks = IOpdsApi["getUrlWithSearchLinks"];
export type TOpdsApiOAuth = IOpdsApi["oauth"];

export type TOpdsApiGetFeed_result = IOpdsFeedView;
export type TOpdsApiDeleteFeed_result = void;
export type TOpdsApiFindAllFeed_result = IOpdsFeedView[];
export type TOpdsApiAddFeed_result = IOpdsFeedView;
export type TOpdsApiUpdateFeed_result = IOpdsFeedView;
export type TOpdsApiBrowse_result = THttpGetOpdsResultView;
export type TOpdsApiGetPublicationFromEntry_result = THttpGetOpdsPublicationView;
export type TOpdsApiGetUrlWithSearchLink_result = ReturnPromiseType<IOpdsApi["getUrlWithSearchLinks"]>;
export type TOpdsApiOAuth_result = boolean;

export interface IOpdsModuleApi {
    "opds/getFeed": TOpdsApiGetFeed;
    "opds/deleteFeed": TOpdsApiDeleteFeed;
    "opds/findAllFeeds": TOpdsApiFindAllFeed;
    "opds/addFeed": TOpdsApiAddFeed;
    "opds/updateFeed": TOpdsApiUpdateFeed;
    "opds/browse": TOpdsApiBrowse;
    "opds/getPublicationFromEntry": TOpdsApiGetPublicationFromEntry;
    "opds/getUrlWithSearchLinks": TOpdsApiGetUrlWithSearchLinks;
    "opds/oauth": TOpdsApiOAuth;
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

    @inject(diSymbolTable["opds-service"])
    private readonly opdsService!: OpdsService;

    public async getFeed(identifier: string): Promise<IOpdsFeedView> {
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

    public async getPublicationFromEntry(url: string): Promise<THttpGetOpdsPublicationView> {
        url = checkUrl(url);

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

                debug("GetPublicationFromEntry return publication =", publication);
                return publication;
            },
            undefined,
            );
    }

    public async browse(url: string): Promise<THttpGetOpdsResultView> {
        url = checkUrl(url);

        return await this.opdsService.opdsRequest(url,
            // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
            (r2OpdsFeed) => this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url),
            (r2OpdsAuth: OPDSAuthenticationDoc) => this.opdsFeedViewConverter.convertOpdsAuthToView(r2OpdsAuth, url),
            );
    }

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

        return await this.opdsService.oauth(
            opdsUrl,
            login,
            passwordEncrypted,
            oAuthUrl,
            oAuthRefreshUrl,
            OPDS_AUTH_ENCRYPTION_KEY_HEX,
            OPDS_AUTH_ENCRYPTION_IV_HEX,
            refreshToken);
    }
}
