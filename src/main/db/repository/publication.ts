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

const ID_PREFIX = "publication_";

const TAG_INDEX = "tag_index";

const TITLE_INDEX = "title_index";

import {
    convertMultiLangStringToString,
} from "readium-desktop/common/utils";

@injectable()
export class PublicationRepository extends BaseRepository<PublicationDocument> {
    public constructor(db: PouchDB.Database) {
        const indexes = [
            {
                fields: ["title"],
                name: TITLE_INDEX,
            },
            {
                fields: ["tags"],
                name: TAG_INDEX,
            },
        ];
        super(db, "publication", indexes);
    }

    public async findByTag(tag: string): Promise<PublicationDocument[]> {
        return this.findBy({ tags: { $elemMatch: { $eq: tag }}});
    }

    public async findByTitle(title: string): Promise<PublicationDocument[]> {
        return this.findBy({ title: { $eq: title }});
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
        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                resources: dbDoc.resources,
                opdsPublication: dbDoc.opdsPublication,
                title: ((typeof dbDoc.title !== "string") ? convertMultiLangStringToString(dbDoc.title) : dbDoc.title),
                tags: dbDoc.tags,
                files: dbDoc.files,
                coverFile: dbDoc.coverFile,
                customCover: dbDoc.customCover,
            },
        );
    }
}
