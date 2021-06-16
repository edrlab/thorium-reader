// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import { IOpdsApi, TOpdsLinkSearch } from "readium-desktop/common/api/interface/opdsApi.interface";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import {
    IOpdsFeedView, THttpGetOpdsResultView,
} from "readium-desktop/common/views/opds";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { OpdsService } from "readium-desktop/main/services/opds";

// import * as debug_ from "debug";
// Logger
// const debug = debug_("readium-desktop:src/main/api/opds");

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

        // ensures no duplicates (same URL ... but may be different titles)
        const opdsFeeds = await this.opdsFeedRepository.findAll();
        const found = opdsFeeds.find((o) => o.url === data.url);
        if (found) {
            return this.opdsFeedViewConverter.convertDocumentToView(found);
        }

        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    // public async updateFeed(data: OpdsFeed): Promise<IOpdsFeedView> {
    //     const doc = await this.opdsFeedRepository.save(data);
    //     return this.opdsFeedViewConverter.convertDocumentToView(doc);
    // }

    public async browse(url: string): Promise<THttpGetOpdsResultView> {
        url = checkUrl(url);

        return this.opdsService.opdsRequest(url);
    }

    public async getUrlWithSearchLinks(searchLink: TOpdsLinkSearch[] | TOpdsLinkSearch)
        : Promise<string | undefined> {
        const link = Array.isArray(searchLink) ? searchLink : [searchLink];
        return this.opdsService.parseOpdsSearchUrl(link);
    }
}
