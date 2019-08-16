// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import { httpGet } from "readium-desktop/common/utils/http";
import { OpdsFeedView, THttpGetOpdsResultView } from "readium-desktop/common/views/opds";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { JSON as TAJSON } from "ta-json-x";
import * as xmldom from "xmldom";

import { convertOpds1ToOpds2 } from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

// Logger
const debug = debug_("readium-desktop:src/main/api/opds");

@injectable()
export class OpdsApi {
    @inject("opds-feed-repository")
    private readonly opdsFeedRepository!: OpdsFeedRepository;

    @inject("opds-feed-view-converter")
    private readonly opdsFeedViewConverter!: OpdsFeedViewConverter;

    public async getFeed(data: any): Promise<OpdsFeedView> {
        const { identifier } = data;
        const doc = await this.opdsFeedRepository.get(identifier);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async deleteFeed(data: any): Promise<void> {
        const { identifier } = data;
        await this.opdsFeedRepository.delete(identifier);
    }

    public async findAllFeeds(): Promise<OpdsFeedView[]> {
        const docs = await this.opdsFeedRepository.findAll();
        return docs.map((doc) => {
            return this.opdsFeedViewConverter.convertDocumentToView(doc);
        });
    }

    public async addFeed(data: any): Promise<OpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async updateFeed(data: any): Promise<OpdsFeedView> {
        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async browse(data: any): Promise<THttpGetOpdsResultView> {
        const { url } = data;
        return await httpGet(url, {
            timeout: 10000,
        }, async (opdsFeedData) => {
            // let opds2Publication: OPDSPublication = null;
            let opds2Feed: OPDSFeed = null;

            if (opdsFeedData.isFailure) {
                return opdsFeedData;
            }

            debug("opdsFeed content-type", opdsFeedData.contentType);
            if (!opdsFeedData.contentType.startsWith("application/json") &&
                !opdsFeedData.contentType.startsWith("application/opds+json") &&
                !opdsFeedData.contentType.startsWith("application/atom+xml")) {
                throw new Error(`Not a valid OPDS HTTP Content-Type:
                    ${opdsFeedData.url} => ${opdsFeedData.contentType}`);
            }

            // This is an opds feed in version 1
            // Convert to opds version 2
            const xmlDom = new xmldom.DOMParser().parseFromString(opdsFeedData.body);
            if (xmlDom && xmlDom.documentElement) {
                const isEntry = xmlDom.documentElement.localName === "entry";
                if (isEntry) {
                    throw new Error("OPDS feed is entry");
                }
                // This is an opds feed in version 1
                // Convert to opds version 2
                const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
                opds2Feed = convertOpds1ToOpds2(opds1Feed);
            } else {
                opds2Feed = TAJSON.deserialize<OPDSFeed>(
                    JSON.parse(opdsFeedData.body),
                    OPDSFeed,
                );
            }
            opdsFeedData.data = await this.opdsFeedViewConverter.convertOpdsFeedToView(opds2Feed);
            return opdsFeedData;
        });
    }
}
