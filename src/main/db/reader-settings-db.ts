import { injectable} from "inversify";
import * as PouchDB from "pouchdb-core";

import { Settings } from "readium-desktop/common/models/settings";

@injectable()
export class ReaderSettingsDb {
    private db: PouchDB.Database;

    public constructor(db: PouchDB.Database) {
        this.db = db;
    }

    public put(settings: Settings): Promise<any> {
        if (settings.identifier) {
            return this.db.put(Object.assign(
                {},
                settings,
                { _id: settings.identifier },
            ));
        } else {
            return this.db.put(Object.assign(
                {},
                settings,
            ));
        }
    }

    public get(identifier: string): Promise<Settings> {
        return this.db
            .get(identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return result;
            })
            .catch((error) => {
                throw error;
            });
    }

    public update(settings: Settings): Promise<any> {
        return this.db
            .get(settings.identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return this.db.put(Object.assign(
                    {},
                    settings,
                    {
                        _id: settings.identifier,
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

    public getAll(): Promise<Settings[]> {
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
