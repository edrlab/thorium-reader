// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { NotFoundError } from "readium-desktop/main/db/exceptions";
// import { v4 as uuidv4 } from "uuid";

interface Index  {
    name: string;
    fields: string[];
}

export type ExcludeTimestampableAndIdentifiable<D> = Omit<D, keyof Timestampable | keyof Identifiable>;
// tslint:disable-next-line: max-line-length
export type ExcludeTimestampableWithPartialIdentifiable<D> = ExcludeTimestampableAndIdentifiable<D> & Partial<Identifiable>;

export abstract class BaseRepository<D extends Identifiable & Timestampable> {
    protected db: PouchDB.Database<D>;
    protected idPrefix: string;
    protected indexes: Index[];

    public constructor(db: PouchDB.Database<D>, idPrefix: string, indexes?: Index[]) {
        this.db = db;
        this.idPrefix = idPrefix;
        this.indexes = (indexes == null) ? [] : indexes;
    }

    public buildId(documentIdentifier: string) {
        return this.idPrefix + "_" + documentIdentifier;
    }

    // public async save(document: ExcludeTimestampableWithPartialIdentifiable<D>):
    //     Promise<D> {

    //     if (!document.identifier) {
    //         document.identifier = uuidv4();
    //     }

    //     let dbDoc: PouchDB.Core.PutDocument<D> = this.convertFromDocument(document);

    //     // Search if there is an existing document with the same identifier
    //     try {
    //         const origDbDoc = await this.db.get(
    //             this.buildId(document.identifier),
    //         );

    //         dbDoc = Object.assign(
    //             dbDoc,
    //             {
    //                 createdAt: origDbDoc.createdAt,
    //             } as Timestampable,
    //             {
    //                 _id: origDbDoc._id,
    //             } as PouchDB.Core.IdMeta,
    //             {
    //                 _rev: origDbDoc._rev,
    //             } as PouchDB.Core.GetMeta,
    //         );
    //     } catch (_error) {
    //         // Not found, so this is a new one
    //         dbDoc = Object.assign(
    //             dbDoc,
    //             {
    //                 _id: this.buildId(document.identifier),
    //             } as PouchDB.Core.IdMeta,
    //             {
    //                 createdAt: dbDoc.updatedAt,
    //             } as Timestampable,
    //             {
    //                 identifier: document.identifier,
    //             } as Identifiable,
    //         );
    //     }

    //     await this.db.put(dbDoc);

    //     return this.get(document.identifier);
    // }

    public async get(identifier: string): Promise<D> {
        try {
            const dbDoc = await this.db.get(this.buildId(identifier));
            return this.convertToDocument(dbDoc);
        } catch (_error) {
            throw new NotFoundError("document not found");
        }
    }

    public async delete(identifier: string): Promise<void> {
        const dbDoc = await this.db.get(this.buildId(identifier));
        await this.db.remove(dbDoc);
    }

    public async findAll(): Promise<D[]> {
        const result = await this.db.allDocs({
            include_docs: true,
            startkey: this.idPrefix + "_",
            endkey: this.idPrefix + "_\ufff0",
        });
        return result.rows.map((row) => {
            return this.convertToDocument(row.doc);
        });
    }

    public async find(query?: PouchDB.Find.FindRequest<D>): Promise<D[]> {
        await this.checkIndexes();
        const newQuery: PouchDB.Find.FindRequest<D> = Object.assign(
            {},
        );

        if (query.selector) {
            newQuery.selector = query.selector;
        } else {
            newQuery.selector = {};
        }

        if (query.limit) {
            newQuery.limit = query.limit;
        }

        if (query.sort) {
            newQuery.sort = query.sort;

            for (const sortOption of newQuery.sort) {
                const sortField = Object.keys(sortOption)[0];

                if (sortField in newQuery.selector) {
                    // Sort field is already in selector
                    continue;
                }

                // Add sort field to selector
                newQuery.selector[sortField] = { $gt: null };
            }
        }

        if (Object.keys(newQuery.selector).length === 0) {
            // You need at least one selector
            newQuery.selector = { identifier: { $gt: null }};
        }

        try {
            const result = await this.db.find(newQuery);
            return result.docs.map((doc) => {
                return this.convertToDocument(doc);
            });
        } catch (error) {
            throw error;
        }
    }

    protected async buildIndex(index: Index) {
        try {

            await this.db.createIndex({
                index: {
                    fields: index.fields,
                    name: index.name,
                    ddoc: index.name,
                },
            });
        } catch (error) {
            throw error;
        }
    }

    protected async buildIndexes() {
        for (const index of this.indexes) {
            await this.buildIndex(index);
        }
    }

    /**
     * Check that indexes are correctly built
     */
    protected async checkIndexes() {
        let indexQuery = null;

        try {
            // Test if index exists
            indexQuery = await this.db.getIndexes();
        } catch (error) {
            throw error;
        }

        for (const index of this.indexes) {
            let indexExists = false;

            for (const dbIndex of indexQuery.indexes) {
                if (dbIndex.name === index.name) {
                    indexExists = true;
                    break;
                }
            }

            if (!indexExists) {
                // If not create index
                await this.buildIndex(index);
            }
        }
    }

    protected convertFromDocument(document: ExcludeTimestampableWithPartialIdentifiable<D>):
        PouchDB.Core.PutDocument<D> {

        return Object.assign(
            {} as D,
            document,
            {
                updatedAt: moment.now(),
            } as Timestampable,
        );
    }

    protected convertToMinimalDocument(dbDoc: PouchDB.Core.Document<D>): Timestampable & Identifiable {
        return {
            identifier: dbDoc.identifier,
            createdAt: dbDoc.createdAt,
            updatedAt: dbDoc.updatedAt,
        } as Timestampable & Identifiable;
    }

    protected abstract convertToDocument(dbDoc: PouchDB.Core.Document<D>): D;
}
