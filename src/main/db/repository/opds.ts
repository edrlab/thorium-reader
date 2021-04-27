// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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

@injectable()
export class OpdsFeedRepository /*extends BaseRepository<OpdsFeedDocument>*/ {
    db: PouchDB.Database<OpdsFeedDocument>;
    idPrefix: string;
    public constructor(db: PouchDB.Database<OpdsFeedDocument>) {// INJECTED!
        this.db = db;

        this.idPrefix = "opds-feed";
    }

    public async save(feed: OpdsFeed): Promise<OpdsFeedDocument> {

        const feedAction = opdsActions.addOpdsFeed.build(feed);
        const store = diMainGet("store");
        let unsub: Unsubscribe;
        const p = new Promise<OpdsFeedDocument>(
            (res) => (unsub = store.subscribe(() => {
                const o = store.getState().opds.catalog.find((v) =>
                    v.identifier === feedAction.payload[0]?.identifier);
                if (o) {
                    res(o);
                }
            })));
        store.dispatch(feedAction);

        return p.finally(() => unsub && unsub());
    }

    public async get(identifier: string): Promise<OpdsFeedDocument> {
        // try {
        //     const dbDoc = await this.db.get(this.buildId(identifier));
        //     return this.convertToDocument(dbDoc);
        // } catch (_error) {
        //     throw new NotFoundError("document not found");
        // }

        const store = diMainGet("store");
        const state = store.getState();

        const pub = state.opds.catalog.find((f) => f.identifier === identifier);

        return pub;

    }

    public async findAll(): Promise<OpdsFeedDocument[]> {
        // const result = await this.db.allDocs({
        //     include_docs: true,
        //     startkey: this.idPrefix + "_",
        //     endkey: this.idPrefix + "_\ufff0",
        // });
        // return result.rows.map((row) => {
        //     return this.convertToDocument(row.doc);
        // });
        const store = diMainGet("store");
        const state = store.getState();

        const docs = state.opds.catalog;

        return docs;
    }

    public async delete(identifier: string): Promise<void> {
        // const dbDoc = await this.db.get(this.buildId(identifier));
        // await this.db.remove(dbDoc);
        const store = diMainGet("store");

        let unsub: Unsubscribe;
        const p = new Promise<void>(
            (res) => (unsub = store.subscribe(res)));
        store.dispatch(opdsActions.deleteOpdsFeed.build(identifier));

        await p.finally(() => unsub && unsub());
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
