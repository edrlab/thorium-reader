import * as PouchDB from "pouchdb-core";

export function createDatabase() {
    PouchDB.plugin(require("pouchdb-adapter-memory"));
    PouchDB.plugin(require("pouchdb-find"));
    PouchDB.plugin(require("pouchdb-quick-search"));
    return new PouchDB("test-db", {adapter: "memory"});
}

export async function clearDatabase(db: PouchDB.Database) {
    await db.destroy();
}
