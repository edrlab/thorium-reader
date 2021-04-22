// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";
import * as PouchDB from "pouchdb-core";
import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
import { PublicationDocument, Resources } from "readium-desktop/main/db/document/publication";

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
        const dbDocs = await this.db.search({
            query: title,
            fields: ["title"],
            include_docs: true,
            highlighting: false,
        });

        return dbDocs.rows.map((dbDoc) => {
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

        let r2PublicationJson = dbDoc.resources.r2PublicationJson;
        if (!r2PublicationJson) {
            const r2PublicationBase64 =
                (dbDoc.resources as any).r2PublicationBase64 ||
                (dbDoc.resources as any).filePublication; // legacy obsolete field;
            if (r2PublicationBase64) {
                try {
                    const r2PublicationStr = Buffer.from(r2PublicationBase64, "base64").toString("utf-8");
                    r2PublicationJson = JSON.parse(r2PublicationStr);
                } catch (_err) {
                    r2PublicationJson = undefined;
                }
            }
        }

        let r2OpdsPublicationJson = dbDoc.resources.r2OpdsPublicationJson;
        if (!r2OpdsPublicationJson) {
            const r2OpdsPublicationBase64 =
                (dbDoc.resources as any).r2OpdsPublicationBase64 ||
                (dbDoc.resources as any).opdsPublication; // legacy obsolete field;
            if (r2OpdsPublicationBase64) {
                try {
                    const r2OpdsPublicationStr = Buffer.from(r2OpdsPublicationBase64, "base64").toString("utf-8");
                    r2OpdsPublicationJson = JSON.parse(r2OpdsPublicationStr);
                } catch (_err) {
                    r2OpdsPublicationJson = undefined;
                }
            }
        }

        let r2LCPJson = dbDoc.resources.r2LCPJson;
        if (!r2LCPJson) {
            const r2LCPBase64 =
                (dbDoc.resources as any).r2LCPBase64;
            if (r2LCPBase64) {
                try {
                    const r2LCPStr = Buffer.from(r2LCPBase64, "base64").toString("utf-8");
                    r2LCPJson = JSON.parse(r2LCPStr);
                } catch (_err) {
                    r2LCPJson = undefined;
                }
            }
        }

        let r2LSDJson = dbDoc.resources.r2LSDJson;
        if (!r2LSDJson) {
            const r2LSDBase64 =
                (dbDoc.resources as any).r2LSDBase64;
            if (r2LSDBase64) {
                try {
                    const r2LSDStr = Buffer.from(r2LSDBase64, "base64").toString("utf-8");
                    r2LSDJson = JSON.parse(r2LSDStr);
                } catch (_err) {
                    r2LSDJson = undefined;
                }
            }
        }

        const resources: Resources | undefined = dbDoc.resources ? {

            r2PublicationJson,
            r2OpdsPublicationJson,
            r2LCPJson,
            r2LSDJson,

            // Legacy Base64 data blobs
            // r2PublicationBase64: dbDoc.resources.r2PublicationBase64 ||
            //     (dbDoc.resources as any).filePublication, // legacy obsolete field
            // r2OpdsPublicationBase64: dbDoc.resources.r2OpdsPublicationBase64 ||
            //     (dbDoc.resources as any).opdsPublication, // legacy obsolete field
            // r2LCPBase64: dbDoc.resources.r2LCPBase64,
            // r2LSDBase64: dbDoc.resources.r2LSDBase64,
        } : undefined;

        return Object.assign(
            {},
            super.convertToMinimalDocument(dbDoc),
            {
                resources,
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
