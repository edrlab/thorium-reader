// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";

import { BaseRepository, ExcludeTimestampableAndIdentifiable } from "./base";

const CREATED_AT_INDEX = "created_at_index";

const TAG_INDEX = "tag_index";

const TITLE_INDEX = "title_index";

const HASH_INDEX = "hash_index";

@injectable()
export class PublicationRepository extends BaseRepository<PublicationDocument> {
    public constructor(db: PouchDB.Database<PublicationDocument>) {// INJECTED!

        const indexes = [
            {
                fields: ["createdAt"], // Timestampable
                name: CREATED_AT_INDEX,
            },
            {
                fields: ["title"], // PublicationDocument
                name: TITLE_INDEX,
            },
            {
                fields: ["tags"], // PublicationDocument
                name: TAG_INDEX,
            },
            {
                fields: ["hash"], // PublicationDocument
                name: HASH_INDEX,
            },
        ];
        super(db, "publication", indexes);
    }

    public async findByHashId(hash: string): Promise<PublicationDocument[]> {
        return this.find({
            selector: { hash: { $eq: hash }},
        });
    }

    public async findByTag(tag: string): Promise<PublicationDocument[]> {
        return this.find({
            selector: { tags: { $elemMatch: { $eq: tag }}},
        });
    }

    public async findByTitle(title: string): Promise<PublicationDocument[]> {
        return this.find({
            selector: { title: { $eq: title }},
        });
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
        await this.checkIndexes();
        const dbResponse = await this.db.find({
            selector: {
                tags: {
                    $exists: true,
                },
            },
            fields: ["tags"],
        });
        const tags: string[] = [];

        for (const doc of dbResponse.docs) {
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

    protected convertToDocument(dbDoc: PouchDB.Core.Document<PublicationDocument>): PublicationDocument {
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
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
