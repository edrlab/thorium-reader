// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
import { PublicationDocument, PublicationDocumentWithoutTimestampable } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { publicationActions } from "readium-desktop/main/redux/actions";
import { Unsubscribe } from "redux";
import { ExcludeTimestampableAndIdentifiable } from "./base";

// const CREATED_AT_INDEX = "created_at_index";

// const TAG_INDEX = "tag_index";

// const TITLE_INDEX = "title_index";

// const HASH_INDEX = "hash_index";

@injectable()
export class PublicationRepository  /* extends BaseRepository<PublicationDocument> */ {
    db: PouchDB.Database<PublicationDocument>;
    public constructor(db: PouchDB.Database<PublicationDocument>) {// INJECTED!

        this.db = db;
        // const indexes = [
            // {
            //     fields: ["createdAt"], // Timestampable
            //     name: CREATED_AT_INDEX,
            // },
            // {
            //     fields: ["title"], // PublicationDocument
            //     name: TITLE_INDEX,
            // },
            // {
            //     fields: ["tags"], // PublicationDocument
            //     name: TAG_INDEX,
            // },
            // {
            //     fields: ["hash"], // PublicationDocument
            //     name: HASH_INDEX,
            // },
        // ];
        // super(db, "publication", indexes);
    }

    public async save(document: PublicationDocumentWithoutTimestampable): Promise<PublicationDocument> {

        const store = diMainGet("store");
        let unsub: Unsubscribe;
        const p = new Promise<PublicationDocument>(
            (res) => (unsub = store.subscribe(() =>
                    res(store.getState().publication.db.find((v) =>
                        v.identifier === document.identifier)))));
        store.dispatch(publicationActions.addPublication.build(document));

        return p.finally(() => unsub && unsub());
    }

    public async get(identifier: string): Promise<PublicationDocument> {
        // try {
        //     const dbDoc = await this.db.get(this.buildId(identifier));
        //     return this.convertToDocument(dbDoc);
        // } catch (_error) {
        //     throw new NotFoundError("document not found");
        // }

        const store = diMainGet("store");
        const state = store.getState();

        const pub = state.publication.db.find((f) => f.identifier === identifier);

        return pub;

    }

    public async delete(identifier: string): Promise<void> {
        // const dbDoc = await this.db.get(this.buildId(identifier));
        // await this.db.remove(dbDoc);
        const store = diMainGet("store");

        let unsub: Unsubscribe;
        const p = new Promise<void>(
            (res) => (unsub = store.subscribe(res)));
        store.dispatch(publicationActions.deletePublication.build(identifier));

        await p.finally(() => unsub && unsub());
    }

    public async findAllFromPouchdb(): Promise<PublicationDocument[]> {

        const result = await this.db.allDocs({
            include_docs: true,
            startkey: "publication" + "_",
            endkey: "publication" + "_\ufff0",
        });
        return result.rows.map((row) => {
            return this.convertToDocument(row.doc);
        });
    }

    public async findAll(): Promise<PublicationDocument[]> {
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

        const docs = state.publication.db;

        return docs;
    }

    public async findAllSortDesc(): Promise<PublicationDocument[]> {

        const docs = await this.findAll();

        const docsSorted = docs.sort((a,b) => b.createdAt - a.createdAt);

        return docsSorted;
    }

    public async findByHashId(hash: string): Promise<PublicationDocument[]> {
        // return this.find({
            // selector: { hash: { $eq: hash }},
        // });
        try {

            const store = diMainGet("store");
            const state = store.getState();

            const pub = state.publication.db.find((f) => f.hash === hash);

            ok(pub);

            return [pub];

        } catch (e) {

            console.log("####");
            console.log("findByHashId error ", e);
            console.log("####");

            return [];
        }
    }

    public async findByTag(tag: string): Promise<PublicationDocument[]> {
        // return this.find({
            // selector: { tags: { $elemMatch: { $eq: tag }}},
        // });
        try {

            const store = diMainGet("store");
            const state = store.getState();

            const pubs = state.publication.db.filter((f) => f.tags.includes(tag));

            return pubs;

        } catch (e) {

            console.log("####");
            console.log("findByTag error ", e);
            console.log("####");

            return [];
        }
    }

    public async findByTitle(title: string): Promise<PublicationDocument[]> {
        // return this.find({
        //     selector: { title: { $eq: title }},
        // });
        try {

            const store = diMainGet("store");
            const state = store.getState();

            const pubs = state.publication.db.filter((f) => f.title === title);

            return pubs;

        } catch (e) {

            console.log("####");
            console.log("findByTitle error ", e);
            console.log("####");

            return [];
        }
    }

    public async searchByTitle(title: string): Promise<PublicationDocument[]> {
        // const dbDocs = await this.db.search({
        //     query: title,
        //     fields: ["title"],
        //     include_docs: true,
        //     highlighting: false,
        // });

        // return dbDocs.rows.map((dbDoc) => {
        //     return this.convertToDocument(dbDoc.doc);
        // });

        try {

            const store = diMainGet("store");
            const state = store.getState();

            const indexer = state.publication.indexer;

            const res = indexer.search(title);

            ok(Array.isArray(res));
            const docs = res
                .map((v: any) => state.publication.db.find((f) => v.ref === f.identifier))
                .filter((v) => !!v);

            return docs;

        } catch (e) {

            console.log("####");
            console.log("searchByTitle error ", e);
            console.log("####");

            return [];
        }
    }

    /** Returns all publication tags */
    public async getAllTags(): Promise<string[]> {

        let docs: PublicationDocument[];
        try {

            const store = diMainGet("store");
            const state = store.getState();

            docs = state.publication.db;

        } catch (e) {

            console.log("####");
            console.log("getAllTags error ", e);
            console.log("####");

            return [];
        }


        const tags: string[] = [];

        for (const doc of docs) {
            for (const tag of doc.tags) {
                if (tags.indexOf(tag) >= 0) {
                    continue;
                }

                tags.push(tag);
            }
        }

        // Sort asc
        tags.sort();
        return tags;
    }

    protected convertToMinimalDocument(dbDoc: PouchDB.Core.Document<PublicationDocument>): Timestampable & Identifiable {
        return {
            identifier: dbDoc.identifier,
            createdAt: dbDoc.createdAt,
            updatedAt: dbDoc.updatedAt,
        } as Timestampable & Identifiable;
    }

    protected convertToDocument(dbDoc: PouchDB.Core.Document<PublicationDocument>): PublicationDocument {
        return Object.assign(
            {},
            this.convertToMinimalDocument(dbDoc),
            {
                resources: dbDoc.resources ? {
                    // legacy names fallback
                    r2PublicationBase64: dbDoc.resources.r2PublicationBase64 ||
                        (dbDoc.resources as any).filePublication, // legacy obsolete field
                    r2OpdsPublicationBase64: dbDoc.resources.r2OpdsPublicationBase64 ||
                        (dbDoc.resources as any).opdsPublication, // legacy obsolete field
                    r2LCPBase64: dbDoc.resources.r2LCPBase64,
                    r2LSDBase64: dbDoc.resources.r2LSDBase64,
                } : undefined,
                title: ((typeof dbDoc.title !== "string") ? convertMultiLangStringToString(dbDoc.title) : dbDoc.title),
                tags: dbDoc.tags,
                files: dbDoc.files,
                coverFile: dbDoc.coverFile,
                customCover: dbDoc.customCover,

                lcp: dbDoc.lcp,
                lcpRightsCopies: dbDoc.lcpRightsCopies,

                hash: dbDoc.hash,
            } as ExcludeTimestampableAndIdentifiable<PublicationDocument>,
        );
    }
}
