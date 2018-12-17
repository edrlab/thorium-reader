// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";

import { JSON as TAJSON } from "ta-json-x";

import * as xmldom from "xmldom";

import {
    convertOpds1ToOpds2,
    convertOpds1ToOpds2_EntryToPublication,
} from "@r2-opds-js/opds/converter";

import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";

import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

import { OpdsFeedView } from "readium-desktop/common/views/opds";

import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";

import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";

import { httpGet } from "readium-desktop/common/utils";
import { OpdsParsingError } from "../exceptions/opds";

@injectable()
export class OpdsApi {
    private opdsFeedRepository: OpdsFeedRepository;
    private opdsFeedViewConverter: OpdsFeedViewConverter;

    constructor(
        opdsFeedRepository: OpdsFeedRepository,
        opdsFeedViewConverter: OpdsFeedViewConverter,
    ) {
        this.opdsFeedRepository = opdsFeedRepository;
        this.opdsFeedViewConverter = opdsFeedViewConverter;
    }

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

    public async browse(data: any): Promise<any> {
        const { url } = data;
        const opdsFeedData = await httpGet(url) as string;
        let opds2Publication: OPDSPublication = null;
        let opds2Feed: OPDSFeed = null;

        if (opdsFeedData.startsWith("<?xml")) {
            // This is an opds feed in version 1
            // Convert to opds version 2
            const xmlDom = new xmldom.DOMParser().parseFromString(opdsFeedData);

            if (!xmlDom || !xmlDom.documentElement) {
                throw new OpdsParsingError(`Unable to parse ${url}`);
            }

            const isEntry = xmlDom.documentElement.localName === "entry";

            if (isEntry) {
                const opds1Entry = XML.deserialize<Entry>(xmlDom, Entry);
                opds2Publication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
                console.log("####", opds2Publication);
            } else {
                const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
                opds2Feed = convertOpds1ToOpds2(opds1Feed);
                return this.opdsFeedViewConverter.convertOpdsFeedToView(opds2Feed);
            }
        } else {
            opds2Feed = TAJSON.deserialize<OPDSFeed>(
                JSON.parse(opdsFeedData),
                OPDSFeed,
            );
            return this.opdsFeedViewConverter.convertOpdsFeedToView(opds2Feed);
        }
    }
}
