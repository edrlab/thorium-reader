// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import {
    IOpdsFeedView, IOpdsLinkView, THttpGetOpdsResultView,
} from "readium-desktop/common/views/opds";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { OpdsService } from "readium-desktop/main/services/opds";
import { ReturnPromiseType } from "readium-desktop/typings/promise";

// Logger
// const debug = debug_("readium-desktop:src/main/api/opds");

export interface IOpdsApi {
    getFeed: (identifier: string) => Promise<IOpdsFeedView>;
    deleteFeed: (identifier: string) => Promise<void>;
    findAllFeeds: () => Promise<IOpdsFeedView[]>;
    addFeed: (data: OpdsFeed) => Promise<IOpdsFeedView>;
    updateFeed: (data: OpdsFeed) => Promise<IOpdsFeedView>;
    browse: (url: string) => Promise<THttpGetOpdsResultView>;
    getUrlWithSearchLinks: (searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch) => Promise<string | undefined>;
}

export type TOpdsApiGetFeed = IOpdsApi["getFeed"];
export type TOpdsApiDeleteFeed = IOpdsApi["deleteFeed"];
export type TOpdsApiFindAllFeed = IOpdsApi["findAllFeeds"];
export type TOpdsApiAddFeed = IOpdsApi["addFeed"];
export type TOpdsApiUpdateFeed = IOpdsApi["updateFeed"];
export type TOpdsApiBrowse = IOpdsApi["browse"];
export type TOpdsApiGetUrlWithSearchLinks = IOpdsApi["getUrlWithSearchLinks"];

export type TOpdsApiGetFeed_result = IOpdsFeedView;
export type TOpdsApiDeleteFeed_result = void;
export type TOpdsApiFindAllFeed_result = IOpdsFeedView[];
export type TOpdsApiAddFeed_result = IOpdsFeedView;
export type TOpdsApiUpdateFeed_result = IOpdsFeedView;
export type TOpdsApiBrowse_result = THttpGetOpdsResultView;
export type TOpdsApiGetUrlWithSearchLink_result = ReturnPromiseType<IOpdsApi["getUrlWithSearchLinks"]>;

export interface IOpdsModuleApi {
    "opds/getFeed": TOpdsApiGetFeed;
    "opds/deleteFeed": TOpdsApiDeleteFeed;
    "opds/findAllFeeds": TOpdsApiFindAllFeed;
    "opds/addFeed": TOpdsApiAddFeed;
    "opds/updateFeed": TOpdsApiUpdateFeed;
    "opds/browse": TOpdsApiBrowse;
    "opds/getUrlWithSearchLinks": TOpdsApiGetUrlWithSearchLinks;
}

type TOpdsLinkSearch = Required<Pick<IOpdsLinkView, "url" | "type">>;

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

    public async browse(url: string): Promise<THttpGetOpdsResultView> {
        try {
            if (new URL(url).protocol === "opds:") {
                url = url.replace("opds://", "http://");
            }
        } catch (e) {
            throw new Error(`api-opds-browse ${e.message}`);
        }
        return await this.opdsService.opdsRequest(url,
            // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
            (r2OpdsFeed) => this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url));
    }
/*
// FIXME : add new api method to browse and return opdsView only without affect opds navigateur in front-end
    public async browse(url: string): Promise<THttpGetOpdsResultView> {
        try {
            if (new URL(url).protocol === "opds:") {
                url = url.replace("opds://", "http://");
            }
        } catch (e) {
            throw new Error(`api-opds-browse ${e.message}`);
        }
        return await this.opdsService.opdsRequest(url,
            // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
            (r2OpdsFeed) => this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url));
    }
    */

    public async getUrlWithSearchLinks(searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch)
        : Promise<string | undefined> {
        const link = Array.isArray(searchLink) ? searchLink : [searchLink];
        return this.opdsService.parseOpdsSearchUrl(link);
    }
}
