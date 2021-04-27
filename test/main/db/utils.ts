import * as PouchDB from "pouchdb-core";

export function createDatabase<T>(): PouchDB.Database<T> {
    PouchDB.plugin(require("pouchdb-adapter-memory"));
    PouchDB.plugin(require("pouchdb-quick-search"));
    PouchDB.plugin(require("pouchdb-find"));
    return new PouchDB<T>("test-db", {adapter: "memory"});
}

export async function clearDatabase<T>(db: PouchDB.Database<T>) {
    await db.destroy();
}
