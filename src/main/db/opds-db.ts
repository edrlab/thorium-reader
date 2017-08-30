import { injectable} from "inversify";
const PouchDB = require("pouchdb");
import { OPDS } from "readium-desktop/models/opds";

@injectable()
export class OpdsDb {
    private db: PouchDB.Database;

    public constructor(db: PouchDB.Database) {
        this.db = db;
    }

    public put(opds: OPDS): Promise<any> {
        return this.db.put(Object.assign(
            {},
            opds,
            { _id: opds.identifier },
        ));
    }

    public get(identifier: string): Promise<OPDS> {
        return this.db
            .get(identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return this.convertToOPDS(result);
            })
            .catch((error) => {
                throw error;
            });
    }

    public update(opds: OPDS): Promise<any> {
        return this.db
            .get(opds.identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return this.db.put(Object.assign(
                    {},
                    opds,
                    {
                        _id: opds.identifier,
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

    public getAll(): Promise<OPDS[]> {
        return this.db
            .allDocs({
                include_docs: true,
            })
            .then((result: PouchDB.Core.AllDocsResponse<any>) => {
                return result.rows.map((row) => {
                    return this.convertToOPDS(row);
                });
            })
            .catch((error: any) => {
                throw error;
            });
    }

    private convertToOPDS(dbDoc: PouchDB.Core.Document<any>): OPDS {
        return  {
            identifier: dbDoc.doc.identifier,
            name: dbDoc.doc.name,
            url: dbDoc.doc.url,
        };
    }
}
