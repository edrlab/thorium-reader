import { injectable} from "inversify";
import * as PouchDB from "pouchdb";

import { OPDS } from "readium-desktop/models/opds";

import * as uuid from "uuid";

const ID_PREFIX = "opds_";

@injectable()
export class OpdsDb {
    private db: PouchDB.Database;

    public constructor(db: PouchDB.Database) {
        this.db = db;
    }

    public put(Opds: OPDS): Promise<any> {
        return this.db.put(Object.assign(
            {},
            Opds,
            { _id: uuid.v4() },
        ));
    }

    public get(identifier: string): Promise<OPDS> {
        return this.db
            .get(ID_PREFIX + identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return this.convertToOPDS(result);
            })
            .catch((error) => {
                throw error;
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
