import { injectable} from "inversify";
import * as PouchDB from "pouchdb-core";

const ID_PREFIX = "config_";

@injectable()
export class ConfigDb {
    private db: PouchDB.Database;

    public constructor(db: PouchDB.Database) {
        this.db = db;
    }

    public put(config: any): Promise<any> {
        const identifier = ID_PREFIX + config.identifier;

        return this.db.put(Object.assign(
            {},
            config,
            { _id: identifier },
        ));
    }

    public get(identifier: string): Promise<any> {
        return this.db
            .get(ID_PREFIX + identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return result;
            })
            .catch((error) => {
                throw error;
            });
    }

    public update(config: any): Promise<any> {
        const identifier = ID_PREFIX + config.identifier;

        return this.db
            .get(identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return this.db.put(Object.assign(
                    {},
                    config,
                    {
                        _id: identifier,
                        _rev: result._rev,
                    },
                ));
            })
            .catch((error) => {
                throw error;
            });
    }

    public putOrUpdate(config: any): Promise<any> {
        const identifier = ID_PREFIX + config.identifier;

        return this.db.get(identifier).then((doc) => {
            return this.update(config)
            .catch((error) => {
                console.log(error);
            });
        }).catch((err) => {
            if (err.error === true && err.reason === "missing") {
                return this.put(config);
            }
        });
    }

    public remove(identifier: string): Promise<any> {
        return this.db
            .get(ID_PREFIX + identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                this.db.remove(result);
            })
            .catch((error) => {
                throw error;
            });
    }

    public getAll(): Promise<any[]> {
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
