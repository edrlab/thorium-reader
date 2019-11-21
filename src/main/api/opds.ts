// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import { httpGet } from "readium-desktop/common/utils/http";
import { OpdsFeedView, THttpGetOpdsResultView } from "readium-desktop/common/views/opds";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import * as xmldom from "xmldom";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { convertOpds1ToOpds2 } from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
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
}

export type TOpdsApiGetFeed = IOpdsApi["getFeed"];
export type TOpdsApiDeleteFeed = IOpdsApi["deleteFeed"];
export type TOpdsApiFindAllFeed = IOpdsApi["findAllFeeds"];
export type TOpdsApiAddFeed = IOpdsApi["addFeed"];
export type TOpdsApiUpdateFeed = IOpdsApi["updateFeed"];
export type TOpdsApiBrowse = IOpdsApi["browse"];

export type TOpdsApiGetFeed_result = OpdsFeedView;
export type TOpdsApiDeleteFeed_result = void;
export type TOpdsApiFindAllFeed_result = OpdsFeedView[];
export type TOpdsApiAddFeed_result = OpdsFeedView;
export type TOpdsApiUpdateFeed_result = OpdsFeedView;
export type TOpdsApiBrowse_result = THttpGetOpdsResultView;

export interface IOpdsModuleApi {
    "opds/getFeed": TOpdsApiGetFeed;
    "opds/deleteFeed": TOpdsApiDeleteFeed;
    "opds/findAllFeeds": TOpdsApiFindAllFeed;
    "opds/addFeed": TOpdsApiAddFeed;
    "opds/updateFeed": TOpdsApiUpdateFeed;
    "opds/browse": TOpdsApiBrowse;
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
        return await httpGet(url, {
            timeout: 10000,
        }, async (opdsFeedData) => {
            // let r2OpdsPublication: OPDSPublication = null;
            let r2OpdsFeed: OPDSFeed = null;

            if (opdsFeedData.isFailure) {
                return opdsFeedData;
            }

            debug("opdsFeed content-type", opdsFeedData.contentType);
            if (!OpdsApi.contentTypeisAccepted(opdsFeedData.contentType)) {
                // tslint:disable-next-line: max-line-length
                throw new Error(`Not a valid OPDS HTTP Content-Type for ${opdsFeedData.url} (${opdsFeedData.contentType})`);
            }

            if (opdsFeedData.body.startsWith("<?xml")) {
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

            // warning: modifies each r2OpdsFeed.publications, makes relative URLs absolute with baseUrl(url)!
            opdsFeedData.data = await this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, url);

            return opdsFeedData;
        });
    }
}
