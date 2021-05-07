// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import * as debug_ from "debug";
import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { diMainGet } from "readium-desktop/main/di";
import { opdsActions } from "readium-desktop/main/redux/actions";
import { Unsubscribe } from "redux";

import { ExcludeTimestampableAndIdentifiable } from "./base";

const debug = debug_("readium-desktop:main:db:repository:opds");

@injectable()
export class OpdsFeedRepository /*extends BaseRepository<OpdsFeedDocument>*/ {
    db: PouchDB.Database<OpdsFeedDocument>;
    idPrefix: string;
    public constructor(db: PouchDB.Database<OpdsFeedDocument>) {// INJECTED!
        this.db = db;

        this.idPrefix = "opds-feed";
    }

    public async save(feed: OpdsFeed): Promise<OpdsFeedDocument> {
        debug("OpdsFeed SAVE: ", feed);

        const feedAction = opdsActions.addOpdsFeed.build(feed);
        const id = feedAction.payload[0]?.identifier;
        const store = diMainGet("store");
        let unsub: Unsubscribe;
        const p = new Promise<OpdsFeedDocument>(
            (res) => (unsub = store.subscribe(() => {
                debug("OpdsFeed SAVE store.subscribe ", id);

                const o = store.getState().opds.catalog.find((v) =>
                    v.identifier === id);
                if (o && !o.removedButPreservedToAvoidReMigration) {
                    debug("OpdsFeed SAVE store.subscribe RESOLVE");
                    if (unsub) {
                        unsub();
                    }
                    res(o);
                    return;
                }
                debug("OpdsFeed SAVE store.subscribe PROMISE STALLED? ", id, " ?!".repeat(1000));

                // TODO: Promise 'p' can possibly never resolve or reject
                // (i.e. if the reducer associated with the 'addOpdsFeed' action somehow fails to insert in the catalog store),
                // consequently consumers of save() (e.g. Redux Saga) can hang forever and cause the Unsubscribe memory leak
                //
                // More importantly: Promise 'p' forever remains unresolved
                // when the feed identifier is found (i.e. was successfully added) but the flag 'removedButPreservedToAvoidReMigration' is true
            })));
        debug("OpdsFeed SAVE action: ", id, feedAction);
        store.dispatch(feedAction);

        return p.finally(() => {
            debug("OpdsFeed SAVE finally unsub?: ", id, unsub ? "true" : "false");
        });
    }

    public async delete(identifier: string): Promise<void> {
        debug("OpdsFeed DELETE: ", identifier);

        const store = diMainGet("store");

        let unsub: Unsubscribe;
        const p = new Promise<void>(
            (res) => (unsub = store.subscribe(() => {
                debug("OpdsFeed DELETE store.subscribe ", identifier);

                const o = store.getState().opds.catalog.find((v) =>
                    v.identifier === identifier);
                if (!o || o.removedButPreservedToAvoidReMigration) {
                    debug("OpdsFeed DELETE store.subscribe RESOLVE");
                    if (unsub) {
                        unsub();
                    }
                    res();
                    return;
                }
                debug("OpdsFeed DELETE store.subscribe PROMISE STALLED? ", identifier, " ?!".repeat(1000));

                // TODO: Promise 'p' can possibly never resolve or reject
                // (i.e. if the reducer associated with the 'deleteOpdsFeed' action somehow fails to insert in the catalog store),
                // consequently consumers of delete() (e.g. Redux Saga) can hang forever and cause the Unsubscribe memory leak
                //
                // More importantly: Promise 'p' forever remains unresolved
                // when the feed identifier is found or the flag 'removedButPreservedToAvoidReMigration' is false
                // (in other words, feed not successfully deleted)
            })));
        const feedAction = opdsActions.deleteOpdsFeed.build(identifier);
        debug("OpdsFeed DELETE action: ", identifier, feedAction);
        store.dispatch(feedAction);

        await p.finally(() => {
            debug("OpdsFeed DELETE finally unsub?: ", identifier, unsub ? "true" : "false");
        });
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

    public async findAllFromPouchdb() {

        const result = await this.db.allDocs({
            include_docs: true,
            startkey: this.idPrefix + "_",
            endkey: this.idPrefix + "_\ufff0",
        });
        return result.rows.map((row) => {
            return this.convertToDocument(row.doc);
        });
    }

    protected convertToMinimalDocument(dbDoc: PouchDB.Core.Document<OpdsFeedDocument>): Timestampable & Identifiable {
        return {
            identifier: dbDoc.identifier,
            createdAt: dbDoc.createdAt,
            updatedAt: dbDoc.updatedAt,
        } as Timestampable & Identifiable;
    }

    protected convertToDocument(dbDoc: PouchDB.Core.Document<OpdsFeedDocument>): OpdsFeedDocument {
        return Object.assign(
            {},
            this.convertToMinimalDocument(dbDoc),
            {
                title: dbDoc.title,
                url: dbDoc.url,
            } as ExcludeTimestampableAndIdentifiable<OpdsFeedDocument>,
        );
    }
}
