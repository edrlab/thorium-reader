// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { diMainGet } from "readium-desktop/main/di";
import { httpGetWithAuth } from "readium-desktop/main/network/http";
import { contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, spawn as spawnTyped, put as putTyped } from "typed-redux-saga/macro";
import { opdsActions } from "readium-desktop/common/redux/actions";

// Logger
const debug = debug_("readium-desktop:main#saga/api/opds/feed");

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

    if (!data.authenticationUrl) {

        yield* spawnTyped(function* () {
            try {
        
                const response = yield* callTyped(() => httpGetWithAuth(false)(data.url));
                const opdsFeedJson:any = yield* callTyped(() => response.response.json());
                const opdsFeed = TaJsonDeserialize(
                    opdsFeedJson,
                    OPDSFeed,
                );
                const opdsFeedView = opdsFeedViewConverter.convertOpdsFeedToView(opdsFeed, data.url);
                if (opdsFeedView) {
                    const bookshelf = opdsFeedView.links?.bookshelf[0];
                    if (bookshelf) {
                        const responseBookshelf = yield* callTyped(() => httpGetWithAuth(false)(bookshelf.url));
                        const mimeType = parseContentType(responseBookshelf.contentType);
                        if (contentTypeisOpdsAuth(mimeType)) {
                            // link url found

                            const opdsFeeds = yield* callTyped(() => opdsFeedRepository.findAll());
                            const found = opdsFeeds.find((o) => o.url === data.url);
                            if (found) {
                                yield* callTyped(deleteFeed, found.identifier);
                                yield* callTyped(addFeed, {...found, authenticationUrl: bookshelf.url});

                                yield* putTyped(opdsActions.refresh.build());
                            }
                        }
                    }
                }
            } catch (e) {
                debug(e);
            }
        });
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
