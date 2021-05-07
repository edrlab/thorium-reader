// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as lunr from "lunr";
import * as lunrfr from "@lunr-languages/lunr.fr.js";
import * as lunrde from "@lunr-languages/lunr.de.js";
import * as lunrstemmer from "@lunr-languages/lunr.stemmer.support.js";
import * as lunrmulti from "@lunr-languages/lunr.multi.js";
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

lunrstemmer(lunr);
lunrfr(lunr);
lunrde(lunr);
lunrmulti(lunr);

// const CREATED_AT_INDEX = "created_at_index";

// const TAG_INDEX = "tag_index";

// const TITLE_INDEX = "title_index";

// const HASH_INDEX = "hash_index";

@injectable()
export class PublicationRepository  /* extends BaseRepository<PublicationDocument> */ {
    db: PouchDB.Database<PublicationDocument>;
    public constructor(db: PouchDB.Database<PublicationDocument>) {// INJECTED!

        this.db = db;
    }

    public async save(document: PublicationDocumentWithoutTimestampable): Promise<PublicationDocument> {

        const store = diMainGet("store");
        let unsub: Unsubscribe;
        const p = new Promise<PublicationDocument>(
            (res) => (unsub = store.subscribe(() => {
                const o = store.getState().publication.db[document.identifier];
                if (o && !o.removedButPreservedToAvoidReMigration) {
                    res(o);
                }

                // TODO: Promise 'p' can possibly never resolve or reject
                // (i.e. if the reducer associated with the 'addPublication' action somehow fails to insert in the publication store),
                // consequently consumers of save() (e.g. Redux Saga) can hang forever and cause the Unsubscribe memory leak
                //
                // More importantly: Promise 'p' forever remains unresolved
                // when the pub identifier is found (i.e. was successfully added) but the flag 'removedButPreservedToAvoidReMigration' is true
            })));
        store.dispatch(publicationActions.addPublication.build(document));

        return p.finally(() => unsub && unsub());
    }

    public async get(identifier: string): Promise<PublicationDocument | undefined> {

        const store = diMainGet("store");
        const state = store.getState();

        const pub = state.publication.db[identifier];
        return pub;
    }

    public async delete(identifier: string): Promise<void> {

        const store = diMainGet("store");

        let unsub: Unsubscribe;
        const p = new Promise<void>(
            (res) => (unsub = store.subscribe(() => {
                const o = store.getState().publication.db[identifier];
                if (!o) {
                    res();
                    return;
                }
                if (o.removedButPreservedToAvoidReMigration) {
                    res();
                }

                // TODO: Promise 'p' can possibly never resolve or reject
                // (i.e. if the reducer associated with the 'deletePublication' action somehow fails to insert in the publication store),
                // consequently consumers of delete() (e.g. Redux Saga) can hang forever and cause the Unsubscribe memory leak
                //
                // More importantly: Promise 'p' forever remains unresolved
                // when the feed identifier is found but the flag 'removedButPreservedToAvoidReMigration' is false
                // (in other words, pub not successfully deleted)
            })));
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

        const store = diMainGet("store");
        const state = store.getState();

        return Object.values(state.publication.db)
            .filter((v) => !v.removedButPreservedToAvoidReMigration);
    }

    public async findAllSortDesc(): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const docsSorted = pubs.sort((a,b) => b.createdAt - a.createdAt);

        return docsSorted;
    }

    public async findByHashId(hash: string): Promise<PublicationDocument | undefined> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pub = pubs.find((f) => f.hash === hash);
        return pub;
    }

    public async findByTag(tag: string): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pubsFiltered = pubs.filter((f) => f.tags.includes(tag));
        return pubsFiltered;
    }

    public async findByTitle(title: string): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pubsFiltered = pubs.filter((f) => f.title === title);
        return pubsFiltered;
    }

    public async findByPublicationIdentifier(publicationIdentifier: string): Promise<PublicationDocument[]> {

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const pubsFiltered = pubs.filter((f) => f.identifier === publicationIdentifier);
        return pubsFiltered;
    }


    public async searchByTitle(title: string): Promise<PublicationDocument[]> {

        try {

            const store = diMainGet("store");
            const state = store.getState();

            const pubs = Object.values(state.publication.db);

            const indexer = lunr(function (this: any) {

                try {
                    this.use((lunr as any).multiLanguage("en", "fr", "de"));
                } catch (e) {
                    console.log("lunr multilang not available", e);
                }

                this.field("title", { boost: 10 });
                // this.setRef("id");

                const docs = pubs.map((v) => ({
                    id: v.identifier,
                    title: v.title,
                }));

                docs.forEach((v) => {
                    this.add(v);
                });
            });

            const res = indexer.search(title);
            if (!res) {
                return [];
            }

            ok(Array.isArray(res));
            const docs = res
                .map((v: any) => pubs.find((f) => v.ref === f.identifier))
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

        const pubs = await this.findAll();
        ok(Array.isArray(pubs));
        const tags: string[] = [];

        for (const doc of pubs) {
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

        // let r2PublicationJson = dbDoc.resources.r2PublicationJson;
        // if (!r2PublicationJson) {
        //     const r2PublicationBase64 =
        //         (dbDoc.resources as any).r2PublicationBase64 ||
        //         (dbDoc.resources as any).filePublication; // legacy obsolete field;
        //     if (r2PublicationBase64) {
        //         try {
        //             const r2PublicationStr = Buffer.from(r2PublicationBase64, "base64").toString("utf-8");
        //             r2PublicationJson = JSON.parse(r2PublicationStr);
        //         } catch (_err) {
        //             r2PublicationJson = undefined;
        //         }
        //     }
        // }

        // let r2OpdsPublicationJson = dbDoc.resources.r2OpdsPublicationJson;
        // if (!r2OpdsPublicationJson) {
        //     const r2OpdsPublicationBase64 =
        //         (dbDoc.resources as any).r2OpdsPublicationBase64 ||
        //         (dbDoc.resources as any).opdsPublication; // legacy obsolete field;
        //     if (r2OpdsPublicationBase64) {
        //         try {
        //             const r2OpdsPublicationStr = Buffer.from(r2OpdsPublicationBase64, "base64").toString("utf-8");
        //             r2OpdsPublicationJson = JSON.parse(r2OpdsPublicationStr);
        //         } catch (_err) {
        //             r2OpdsPublicationJson = undefined;
        //         }
        //     }
        // }

        // let r2LCPJson = dbDoc.resources.r2LCPJson;
        // if (!r2LCPJson) {
        //     const r2LCPBase64 =
        //         (dbDoc.resources as any).r2LCPBase64;
        //     if (r2LCPBase64) {
        //         try {
        //             const r2LCPStr = Buffer.from(r2LCPBase64, "base64").toString("utf-8");
        //             r2LCPJson = JSON.parse(r2LCPStr);
        //         } catch (_err) {
        //             r2LCPJson = undefined;
        //         }
        //     }
        // }

        // let r2LSDJson = dbDoc.resources.r2LSDJson;
        // if (!r2LSDJson) {
        //     const r2LSDBase64 =
        //         (dbDoc.resources as any).r2LSDBase64;
        //     if (r2LSDBase64) {
        //         try {
        //             const r2LSDStr = Buffer.from(r2LSDBase64, "base64").toString("utf-8");
        //             r2LSDJson = JSON.parse(r2LSDStr);
        //         } catch (_err) {
        //             r2LSDJson = undefined;
        //         }
        //     }
        // }

        // const resources: Resources | undefined = dbDoc.resources ? {

        //     r2PublicationJson,
        //     // r2OpdsPublicationJson,
        //     // r2LCPJson,
        //     // r2LSDJson,

        //     // Legacy Base64 data blobs
        //     // r2PublicationBase64: dbDoc.resources.r2PublicationBase64 ||
        //     //     (dbDoc.resources as any).filePublication, // legacy obsolete field
        //     // r2OpdsPublicationBase64: dbDoc.resources.r2OpdsPublicationBase64 ||
        //     //     (dbDoc.resources as any).opdsPublication, // legacy obsolete field
        //     // r2LCPBase64: dbDoc.resources.r2LCPBase64,
        //     // r2LSDBase64: dbDoc.resources.r2LSDBase64,
        // } : undefined;

        return Object.assign(
            {},
            this.convertToMinimalDocument(dbDoc),
            {
                // resources,
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
