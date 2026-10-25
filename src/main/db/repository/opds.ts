// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import { ok } from "readium-desktop/common/utils/assert";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { diMainGet } from "readium-desktop/main/di";
import { opdsActions } from "readium-desktop/main/redux/actions";


@injectable()
export class OpdsFeedRepository {

    idPrefix: string;
    public constructor() {
        this.idPrefix = "opds-feed";
    }

    public async save(feed: OpdsFeed): Promise<OpdsFeedDocument> {
        const store = diMainGet("store");
        // Lookup and dispatch stay synchronous: no other writer can interleave.
        const existing = store.getState().opds.catalog.find((entry) =>
            !entry.removedButPreservedToAvoidReMigration && entry.url === feed.url);
        if (existing) {
            return feed.authenticationUrl && feed.authenticationUrl !== existing.authenticationUrl
                ? this.update(existing.identifier, { authenticationUrl: feed.authenticationUrl })
                : existing;
        }
        if (feed.identifier && store.getState().opds.catalog.some((entry) => entry.identifier === feed.identifier)) {
            throw new Error(`OPDS feed identifier already exists: ${feed.identifier}`);
        }
        const action = opdsActions.addOpdsFeed.build(feed);
        store.dispatch(action);
        return store.getState().opds.catalog.find((entry) => entry.identifier === action.payload[0].identifier);
    }

    public async update(identifier: string, patch: Partial<OpdsFeed>): Promise<OpdsFeedDocument> {
        const store = diMainGet("store");
        const current = store.getState().opds.catalog.find((entry) =>
            entry.identifier === identifier && !entry.removedButPreservedToAvoidReMigration);
        if (!current) {
            throw new Error(`OPDS feed not found: ${identifier}`);
        }
        // Merge the patch against current state, never a caller's old snapshot.
        const action = opdsActions.addOpdsFeed.build({ ...current, ...patch, identifier });
        store.dispatch(action);
        return store.getState().opds.catalog.find((entry) => entry.identifier === identifier);
    }

    public async delete(identifier: string): Promise<void> {
        diMainGet("store").dispatch(opdsActions.deleteOpdsFeed.build(identifier));
    }

    public async findAll(): Promise<OpdsFeedDocument[]> {

        const store = diMainGet("store");
        const state = store.getState();
        const docs = state.opds.catalog
            .filter((v) => !v.removedButPreservedToAvoidReMigration);
        return docs;
    }

    public async get(identifier: string): Promise<OpdsFeedDocument> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pub = pubs.find((f) => f.identifier === identifier);

        return pub;
    }
}
