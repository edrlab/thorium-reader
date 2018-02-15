import { injectable} from "inversify";
import * as PouchDB from "pouchdb-core";

import { ReaderConfig } from "readium-desktop/common/models/reader";

@injectable()
export class ReaderConfigDb {
    private db: PouchDB.Database;

    public constructor(db: PouchDB.Database) {
        this.db = db;
    }

    public put(config: ReaderConfig): Promise<any> {
        if (config.identifier) {
            return this.db.put(Object.assign(
                {},
                config,
                { _id: config.identifier },
            ));
        } else {
            return this.db.put(Object.assign(
                {},
                config,
            ));
        }
    }

    public get(identifier: string): Promise<ReaderConfig> {
        return this.db
            .get(identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return result;
            })
            .catch((error) => {
                throw error;
            });
    }

    public update(config: ReaderConfig): Promise<any> {
        return this.db
            .get(config.identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return this.db.put(Object.assign(
                    {},
                    config,
                    {
                        _id: config.identifier,
                        _rev: result._rev,
                    },
                ));
            })
            .catch((error) => {
                throw error;
            });
    }

    public remove(identifier: string): Promise<any> {
        return this.db
            .get(identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                this.db.remove(result);
            })
            .catch((error) => {
                throw error;
            });
    }

    public getAll(): Promise<ReaderConfig[]> {
        return this.db
            .allDocs({
                include_docs: true,
            })
            .then((result: PouchDB.Core.AllDocsResponse<any>) => {
                return result.rows.map((row) => {
                    return row.doc;
                });
            })
            .catch((error: any) => {
                throw error;
            });
    }
}
