// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as atomically from "atomically";
import * as debug_ from "debug";
import * as fs from "fs";
import * as moment from "moment";
import * as path from "path";
import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { NotFoundError } from "readium-desktop/main/db/exceptions";
import { dbBackupfilePath } from "readium-desktop/main/di";
import { v4 as uuidv4 } from "uuid";

interface Index  {
    name: string;
    fields: string[];
}

export type ExcludeTimestampableAndIdentifiable<D> = Omit<D, keyof Timestampable | keyof Identifiable>;
// tslint:disable-next-line: max-line-length
export type ExcludeTimestampableWithPartialIdentifiable<D> = ExcludeTimestampableAndIdentifiable<D> & Partial<Identifiable>;

// Logger
const debug = debug_("readium-desktop:db:repository:base");

let promiseLockCounter = 0;
const promiseLockDispatch: Array<() => void> = [];
const promiseLock = async <T>(p: Promise<T>): Promise<T> => {

    promiseLockCounter += 1;

    // tslint:disable-next-line: no-floating-promises
    p.then(() => {
        promiseLockCounter -= 1;

        if (promiseLockCounter === 0) {
            promiseLockDispatch.forEach((fn) => fn());
        }
    });

    return p;
};

export abstract class BaseRepository<D extends Identifiable & Timestampable> {
    protected db: PouchDB.Database<D>;
    protected idPrefix: string;
    protected indexes: Index[];

    public constructor(db: PouchDB.Database<D>, idPrefix: string, indexes?: Index[]) {
        this.db = db;
        this.idPrefix = idPrefix;
        this.indexes = (indexes == null) ? [] : indexes;

        this.findAll()
            .then((result) => {
                result.forEach((v) => promiseLock(this.saveToBackupAtomicJsonDb(v)));
            })
            .catch((e) => {
                debug("ERROR DB Backup (findAll)", e);
            });
    }

    public buildId(documentIdentifier: string) {
        return this.idPrefix + "_" + documentIdentifier;
    }

    public async save(document: ExcludeTimestampableWithPartialIdentifiable<D>):
        Promise<D> {

        if (!document.identifier) {
            document.identifier = uuidv4();
        }

        let dbDoc: PouchDB.Core.PutDocument<D> = this.convertFromDocument(document);

        // Search if there is an existing document with the same identifier
        try {
            const origDbDoc = await this.db.get(
                this.buildId(document.identifier),
            );

            dbDoc = Object.assign(
                dbDoc,
                {
                    createdAt: origDbDoc.createdAt,
                } as Timestampable,
                {
                    _id: origDbDoc._id,
                } as PouchDB.Core.IdMeta,
                {
                    _rev: origDbDoc._rev,
                } as PouchDB.Core.GetMeta,
            );
        } catch (_error) {
            // Not found, so this is a new one
            dbDoc = Object.assign(
                dbDoc,
                {
                    _id: this.buildId(document.identifier),
                } as PouchDB.Core.IdMeta,
                {
                    createdAt: dbDoc.updatedAt,
                } as Timestampable,
                {
                    identifier: document.identifier,
                } as Identifiable,
            );
        }

        await this.db.put(dbDoc);

        const result = await this.get(document.identifier);

        try {
            if (promiseLockCounter > 0) {
                await Promise.race([
                    new Promise<void>((_resolve, reject) => setTimeout(reject, 1000)),
                    new Promise<void>((resolve) => {
                        promiseLockDispatch.push(resolve);
                    }),
                ]);
            }
        } catch (e) {
            debug("A dump of the db is in progress");
            debug("timeout 1s rejected");
            debug("force save newest document in backup db");
            debug(e);
        } finally {
            await this.saveToBackupAtomicJsonDb(result);
        }
        return result;
    }

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

    private saveToBackupAtomicJsonDb = async (result: D) => {

        const id = this.buildId(result.identifier);
        const atomicDbPath = path.join(dbBackupfilePath, id + ".json");
        const atomicDbData = JSON.stringify(result);
        try {
            await atomically.writeFile(atomicDbPath, atomicDbData);
        } catch (e) {
            debug("##########");
            debug("##########");
            debug("db backup error to write", id);
            debug(e);
            debug("##########");
            debug("##########");

            // tslint:disable-next-line: max-line-length
            // https://github.com/sindresorhus/conf/blob/a96e9d78ac7e675a24ed702f1c21dd46a0b3ae0e/source/index.ts#L456-L468
            // Fix for https://github.com/sindresorhus/electron-store/issues/106
            // Sometimes on Windows, we will get an EXDEV error when atomic writing
            // (even though to the same directory), so we fall back to non atomic write
            if (e.code === "EXDEV") {
                debug("EXDEV ERROR");
                debug("fs.writeFileSync instead");
                fs.writeFileSync(atomicDbPath, atomicDbData);
            }
        }
    }
}
