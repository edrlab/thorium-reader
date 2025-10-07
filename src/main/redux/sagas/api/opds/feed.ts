// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OpdsFeed } from "readium-desktop/common/models/opds";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { diMainGet } from "readium-desktop/main/di";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped } from "typed-redux-saga/macro";

/*

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

 */

export function* getFeed(identifier: string) {

    const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");
    const opdsFeedRepository = diMainGet("opds-feed-repository");

    const doc = yield* callTyped(() => opdsFeedRepository.get(identifier));
    return yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(doc));
}

export function* deleteFeed(identifier: string) {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    yield* callTyped(() => opdsFeedRepository.delete(identifier));
}

export function* addFeed(data: OpdsFeed): SagaGenerator<IOpdsFeedView> {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");

    // ensures no duplicates (same URL ... but may be different titles)
    const opdsFeeds = yield* callTyped(() => opdsFeedRepository.findAll());
    const found = opdsFeeds.find((o) => o.url === data.url);
    if (found) {
        return yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(found));
    }

    const doc = yield* callTyped(() => opdsFeedRepository.save(data));
    return yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(doc));
}

export function* findAllFeeds(): SagaGenerator<IOpdsFeedView[]> {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");

    const docs = yield* callTyped(() => opdsFeedRepository.findAll());
    const res = [];
    for (const doc of docs) {
        res.push(yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(doc)));
    }
    return res;
}
