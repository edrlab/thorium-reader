// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";
import * as PouchDB from "pouchdb-core";

import { PublicationDocument } from "readium-desktop/main/db/document/publication";

import { BaseRepository } from "./base";

const CREATED_AT_INDEX = "created_at_index";

const TAG_INDEX = "tag_index";

const TITLE_INDEX = "title_index";

const HASH_INDEX = "hash_index";

import {
    convertMultiLangStringToString,
} from "readium-desktop/common/utils";

@injectable()
export class PublicationRepository extends BaseRepository<PublicationDocument> {
    public constructor(db: PouchDB.Database) {
        const indexes = [
            {
                fields: ["createdAt"],
                name: CREATED_AT_INDEX,
            },
            {
                fields: ["title"],
                name: TITLE_INDEX,
            },
            {
                fields: ["tags"],
                name: TAG_INDEX,
            },
            {
                fields: ["hash"],
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
        const dbDocs = await (this.db as any).search({
            query: title,
            fields: ["title"],
            include_docs: true,
            highlighting: false,
        });

        return dbDocs.rows.map((dbDoc: any) => {
            return this.convertToDocument(dbDoc.doc);
        });
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
            for (const tag of (doc as any).tags) {
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

    protected convertToDocument(dbDoc: PouchDB.Core.Document<any>): PublicationDocument {
        if (dbDoc.opdsPublication) {
            console.log("++++++++++++++");
            console.log("++++++++++++++");
            console.log("++++++++++++++");
            console.log("++++++++++++++");
            console.log("++++++++++++++");
            console.log(dbDoc.opdsPublication);
            // tslint:disable-next-line: max-line-length
            console.log(JSON.stringify(JSON.parse(Buffer.from(dbDoc.opdsPublication, "base64").toString("utf-8")), null, 4).substr(0, 1000));
            console.log("++++++++++++++");
            console.log("++++++++++++++");
            console.log("++++++++++++++");
            console.log("++++++++++++++");
            console.log("++++++++++++++");
        }

        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                resources: dbDoc.resources ? {
                    // legacy names fallback
                    r2PublicationBase64: dbDoc.resources.r2PublicationBase64 || dbDoc.resources.filePublication,
                    r2OpdsPublicationBase64: dbDoc.resources.r2OpdsPublicationBase64 || dbDoc.resources.opdsPublication,
                } : undefined,
                // OPDSPublication? seems unused!
                // opdsPublication: dbDoc.opdsPublication,
                title: ((typeof dbDoc.title !== "string") ? convertMultiLangStringToString(dbDoc.title) : dbDoc.title),
                tags: dbDoc.tags,
                files: dbDoc.files,
                coverFile: dbDoc.coverFile,
                customCover: dbDoc.customCover,
                lcp: dbDoc.lcp,
                hash: dbDoc.hash,
            },
        );
    }
}
