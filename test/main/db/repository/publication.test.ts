import "reflect-metadata";

import * as moment from "moment";
import * as PouchDB from "pouchdb-core";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

import { NotFoundError } from "readium-desktop/main/db/exceptions";

import { clearDatabase, createDatabase,  } from "test/main/db/utils";

let repository: PublicationRepository = null;
let db: PouchDB.Database = null;
const now = moment.now();

const dbDocIdentifier1 = "pub-1";
const dbDoc1 = {
    identifier: dbDocIdentifier1,
    _id: "publication_" + dbDocIdentifier1,
    publication: null as any,
    opdsPublication: null as any,
    title: "Publication 1",
    tags: ["science", "computer"],
    files: [] as any,
    coverFile: null as any,
    customCover: null as any,
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "pub-2";
const dbDoc2 = {
    identifier: dbDocIdentifier2,
    _id: "publication_" + dbDocIdentifier2,
    publication: null as any,
    opdsPublication: null as any,
    title: "Publication 2",
    tags: ["node", "computer"],
    files: [] as any,
    coverFile: null as any,
    customCover: null as any,
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase();
    repository = new PublicationRepository(db);

    // Create data
    await db.put(dbDoc1);
    await db.put(dbDoc2);
});

afterEach(async () => {
    repository = null;
    await clearDatabase(db);
});

test("repository.findAll", async () => {
    const result = await repository.findAll();
    expect(result.length).toBe(2);
});

test("repository.findByTag - found", async () => {
    let result = await repository.findByTag("computer");
    expect(result.length).toBe(2);

    result = await repository.findByTag("node");
    expect(result.length).toBe(1);

    const pub = result[0];
    expect(pub.identifier).toBe("pub-2");
    expect(pub.title).toBe("Publication 2");
    expect(pub.tags.length).toBe(2);
    expect(pub.tags).toContain("computer");
    expect(pub.tags).toContain("node");
});

test("repository.findByTag - not found", async () => {
    const result = await repository.findByTag("unknown");
    expect(result.length).toBe(0);
});

test("repository.findByTitle - found", async () => {
    let result = await repository.findByTitle("Publication 1");
    expect(result.length).toBe(1);
});

test("repository.findByTitle - not found", async () => {
    const result = await repository.findByTitle("unknown");
    expect(result.length).toBe(0);
});

test("repository.searchByTitle - found", async () => {
    let result = await repository.searchByTitle("publication");
    expect(result.length).toBe(2);

    result = await repository.searchByTitle("publication 1");
    expect(result.length).toBe(1);
});

test("repository.get - found", async () => {
    const result = await repository.get("pub-1");
    expect(result.identifier).toBe("pub-1");
    expect(result.title).toBe("Publication 1");
    expect(result.tags.length).toBe(2);
    expect(result.tags).toContain("computer");
    expect(result.tags).toContain("science");
});

test("repository.get - not found", async () => {
    // Test unknown key
    try {
        await repository.get("pub-3");
    } catch (e) {
        expect(e.message).toEqual("document not found");
        expect(e instanceof NotFoundError).toBeTruthy();
    }
});

test("repository.save create", async () => {
    const dbDoc = {
        identifier: "new-publication",
        publication: null as any,
        opdsPublication: null as any,
        title: "New publication",
        tags: ["scifi"],
        files: [] as any,
        coverFile: null as any,
        customCover: null as any,
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-publication");
    expect(result.title).toBe("New publication");
    expect(result.tags.length).toBe(1);
    expect(result.tags).toContain("scifi");
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    const dbDoc = {
        identifier: "pub-1",
        publication: null as any,
        opdsPublication: null as any,
        title: "Publication 1",
        tags: ["computer"],
        files: [] as any,
        coverFile: null as any,
        customCover: null as any,
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("pub-1");
    expect(result.title).toBe("Publication 1");
    expect(result.tags.length).toBe(1);
    expect(result.tags).toContain("computer");
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt < result.updatedAt).toBeTruthy();
});

test("repository.delete", async () => {
    let result = await db.get("publication_pub-1") as any;
    expect(result.identifier).toBe("pub-1");

    // Delete publication 1
    await repository.delete("pub-1");
    try {
        await db.get("pub-1") as any;
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
