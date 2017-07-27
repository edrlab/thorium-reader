import { injectable} from "inversify";
import * as PouchDB from "pouchdb";

import { Publication } from "readium-desktop/models/publication";

const ID_PREFIX = "publication_";

@injectable()
export class PublicationDb {
    private db: PouchDB.Database;

    public constructor(db: PouchDB.Database) {
        this.db = db;
    }

    public put(publication: Publication): Promise<any> {
        return this.db.put(Object.assign(
            {},
            publication,
            { _id: ID_PREFIX + publication.identifier },
        ));
    }

    public putOrChange (publication: Publication): Promise<any> {
        return this.db.get(ID_PREFIX + publication.identifier).then((doc) => {
            return this.db.put(Object.assign(
                {},
                publication,
                {
                    _id: ID_PREFIX + publication.identifier,
                    _rev: doc._rev,
                },
            )).catch((error) => {
                console.log("Oh bah c'est une erreur ou je m'y connais pas");
            });
        }).catch((err) => {
            console.error(err);
            if (err.error === true && err.reason === "missing") {
                return this.put(publication);
            }
        });
    }

    public get(identifier: string): Promise<Publication> {
        return this.db
            .get(ID_PREFIX + identifier)
            .then((result: PouchDB.Core.Document<any>) => {
                return this.convertToPublication(result);
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

    public getAll(): Promise<Publication[]> {
        return this.db
            .allDocs({
                include_docs: true,
            })
            .then((result: PouchDB.Core.AllDocsResponse<any>) => {
                return result.rows.map((row) => {
                    return this.convertToPublication(row);
                });
            })
            .catch((error: any) => {
                throw error;
            });
    }

    private convertToPublication(dbDoc: PouchDB.Core.Document<any>): Publication {
        return  {
            identifier: dbDoc.doc.identifier,
            title: dbDoc.doc.title,
            description: dbDoc.doc.description,
            download: dbDoc.doc.download,
            authors: dbDoc.doc.authors,
            languages: dbDoc.doc.languages,
            cover: dbDoc.doc.cover,
            files: dbDoc.doc.files,
            customCover: dbDoc.doc.customCover,
        };
    }
}
