import "reflect-metadata";

import * as moment from "moment";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

import { NotFoundError } from "readium-desktop/main/db/exceptions";

import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: PublicationRepository | null = null;
let db: PouchDB.Database | null = null;
const now = moment.now();

const dbDocIdentifier1 = "pub-1";
const dbDoc1 = {
    identifier: dbDocIdentifier1,
    _id: "publication_" + dbDocIdentifier1,
    publication: null as any,
    // OPDSPublication? seems unused!
    // opdsPublication: null as any,
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
    // OPDSPublication? seems unused!
    // opdsPublication: null as any,
    title: "Publication 2",
    tags: ["node", "computer"],
    files: [] as any,
    coverFile: null as any,
    customCover: null as any,
    createdAt: now - 10,
    updatedAt: now - 10,
};

beforeEach(async () => {
    db = createDatabase();
    repository = new PublicationRepository(db);

    // Create data
    await db.put(dbDoc1);
    await db.put(dbDoc2);
});

afterEach(async () => {
    if (!db) {
        return;
    }
    repository = null;
    await clearDatabase(db);
});

test("repository.findAll", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findAll();
    expect(result.length).toBe(2);
});

test("repository.find limit 1", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.find({
        limit: 1,
        selector: {},
    });
    expect(result.length).toBe(1);
});

test("repository.find sort by createdAt", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.find({
        sort: [{ createdAt: "asc" }],
        selector: {},
    });
    expect(result.length).toBe(2);
    expect(result[0].identifier).toBe("pub-2");
    expect(result[1].identifier).toBe("pub-1");
});

test("repository.findByTag - found", async () => {
    if (!repository) {
        return;
    }
    let result = await repository.findByTag("computer");
    expect(result.length).toBe(2);

    result = await repository.findByTag("node");
    expect(result.length).toBe(1);

    const pub = result[0];
    expect(pub.identifier).toBe("pub-2");
    expect(pub.title).toBe("Publication 2");
    expect(pub.tags).toBeDefined();
    if (pub.tags) {
        expect(pub.tags.length).toBe(2);
    }
    expect(pub.tags).toContain("computer");
    expect(pub.tags).toContain("node");
});

test("repository.findByTag - not found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByTag("unknown");
    expect(result.length).toBe(0);
});

test("repository.findByTitle - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByTitle("Publication 1");
    expect(result.length).toBe(1);
});

test("repository.findByTitle - not found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByTitle("unknown");
    expect(result.length).toBe(0);
});

test("repository.searchByTitle - found", async () => {
    if (!repository) {
        return;
    }
    let result = await repository.searchByTitle("publication");
    expect(result.length).toBe(2);

    result = await repository.searchByTitle("publication 1");
    expect(result.length).toBe(1);
});

test("repository.getAllTags", async () => {
    if (!repository) {
        return;
    }
    const tags = await repository.getAllTags();
    expect(tags.length).toBe(3);
    expect(tags).toContain("computer");
    expect(tags).toContain("node");
    expect(tags).toContain("science");
});

test("repository.get - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.get("pub-1");
    expect(result.identifier).toBe("pub-1");
    expect(result.title).toBe("Publication 1");
    expect(result.tags).toBeDefined();
    if (result.tags) {
        expect(result.tags.length).toBe(2);
    }
    expect(result.tags).toContain("computer");
    expect(result.tags).toContain("science");
});

test("repository.get - not found", async () => {
    if (!repository) {
        return;
    }
    // Test unknown key
    try {
        await repository.get("pub-3");
    } catch (e) {
        expect(e.message).toEqual("document not found");
        expect(e instanceof NotFoundError).toBeTruthy();
    }
});

test("repository.save create", async () => {
    if (!repository) {
        return;
    }
    const dbDoc = {
        identifier: "new-publication",
        publication: null as any,
        // OPDSPublication? seems unused!
        // opdsPublication: null as any,
        title: "New publication",
        tags: ["scifi"],
        files: [] as any,
        coverFile: null as any,
        customCover: null as any,
        resources: {
            r2PublicationBase64: "",
            r2LCPBase64: "",
            r2LSDBase64: "",
            r2OpdsPublicationBase64: "",
        },
        hash: "",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-publication");
    expect(result.title).toBe("New publication");
    expect(result.tags).toBeDefined();
    if (result.tags) {
        expect(result.tags.length).toBe(1);
    }
    expect(result.tags).toContain("scifi");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    if (!repository) {
        return;
    }
    const dbDoc = {
        identifier: "pub-1",
        publication: null as any,
        // OPDSPublication? seems unused!
        // opdsPublication: null as any,
        title: "Publication 1",
        tags: ["computer"],
        files: [] as any,
        coverFile: null as any,
        customCover: null as any,
        resources: {
            r2PublicationBase64: "",
            r2LCPBase64: "",
            r2LSDBase64: "",
            r2OpdsPublicationBase64: "",
        },
        hash: "",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("pub-1");
    expect(result.title).toBe("Publication 1");
    expect(result.tags).toBeDefined();
    if (result.tags) {
        expect(result.tags.length).toBe(1);
    }
    expect(result.tags).toContain("computer");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt < result.updatedAt).toBeTruthy();
});

test("repository.delete", async () => {
    if (!db || !repository) {
        return;
    }
    const result = await db.get("publication_pub-1") as any;
    expect(result.identifier).toBe("pub-1");

    // Delete publication 1
    await repository.delete("pub-1");
    try {
        await db.get("pub-1");
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
