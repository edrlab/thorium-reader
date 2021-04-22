import "reflect-metadata";

import * as moment from "moment";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { NotFoundError } from "readium-desktop/main/db/exceptions";
import { ExcludeTimestampableWithPartialIdentifiable } from "readium-desktop/main/db/repository/base";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: PublicationRepository | null = null;
let db: PouchDB.Database<PublicationDocument> | null = null;
const now = moment.now();

const dbDocIdentifier1 = "pub-1";
const dbDocIdentifier1Internal = `publication_${dbDocIdentifier1}`;
const title1 = "Publication 1";
const tag1 = "science";
const tag2 = "computer";
const dbDoc1: PouchDB.Core.PutDocument<PublicationDocument> = {
    identifier: dbDocIdentifier1,
    _id: dbDocIdentifier1Internal,
    title: title1,
    tags: [tag1, tag2],
    files: [],
    coverFile: null,
    customCover: null,
    resources: {
        r2PublicationJson: undefined,
        r2LCPJson: undefined,
        r2LSDJson: undefined,
        r2OpdsPublicationJson: undefined,

        // Legacy Base64 data blobs
        //
        // r2PublicationBase64: "",
        // r2LCPBase64: "",
        // r2LSDBase64: "",
        // r2OpdsPublicationBase64: "",
    },
    hash: "",
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "pub-2";
const dbDocIdentifier2Internal = `publication_${dbDocIdentifier2}`;
const title2 = "Publication 2";
const tag3 = "node";
const dbDoc2: PouchDB.Core.PutDocument<PublicationDocument> = {
    identifier: dbDocIdentifier2,
    _id: dbDocIdentifier2Internal,
    title: title2,
    tags: [tag3, tag2],
    files: [],
    coverFile: null,
    customCover: null,
    resources: {
        r2PublicationJson: undefined,
        r2LCPJson: undefined,
        r2LSDJson: undefined,
        r2OpdsPublicationJson: undefined,

        // Legacy Base64 data blobs
        //
        // r2PublicationBase64: "",
        // r2LCPBase64: "",
        // r2LSDBase64: "",
        // r2OpdsPublicationBase64: "",
    },
    hash: "",
    createdAt: now - 10,
    updatedAt: now - 10,
};

beforeEach(async () => {
    db = createDatabase<PublicationDocument>();
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
    await clearDatabase<PublicationDocument>(db);
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
    expect(result[0].identifier).toBe(dbDocIdentifier2);
    expect(result[1].identifier).toBe(dbDocIdentifier1);
});

test("repository.findByTag - found", async () => {
    if (!repository) {
        return;
    }
    let result = await repository.findByTag(tag2);
    expect(result.length).toBe(2);

    result = await repository.findByTag(tag3);
    expect(result.length).toBe(1);

    const pub = result[0];
    expect(pub.identifier).toBe(dbDocIdentifier2);
    expect(pub.title).toBe(title2);
    expect(pub.tags).toBeDefined();
    if (pub.tags) {
        expect(pub.tags.length).toBe(2);
    }
    expect(pub.tags).toContain(tag2);
    expect(pub.tags).toContain(tag3);
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
    const result = await repository.findByTitle(title1);
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

    result = await repository.searchByTitle(title1);
    expect(result.length).toBe(1);
});

test("repository.getAllTags", async () => {
    if (!repository) {
        return;
    }
    const tags = await repository.getAllTags();
    expect(tags.length).toBe(3);
    expect(tags).toContain(tag2);
    expect(tags).toContain(tag3);
    expect(tags).toContain(tag1);
});

test("repository.get - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.get(dbDocIdentifier1);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.title).toBe(title1);
    expect(result.tags).toBeDefined();
    if (result.tags) {
        expect(result.tags.length).toBe(2);
    }
    expect(result.tags).toContain(tag2);
    expect(result.tags).toContain(tag1);
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
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<PublicationDocument> = {
        identifier: "new-publication",
        title: "New publication",
        tags: ["scifi"],
        files: [],
        coverFile: null,
        customCover: null,
        resources: {
            r2PublicationJson: undefined,
            r2LCPJson: undefined,
            r2LSDJson: undefined,
            r2OpdsPublicationJson: undefined,

            // Legacy Base64 data blobs
            //
            // r2PublicationBase64: "",
            // r2LCPBase64: "",
            // r2LSDBase64: "",
            // r2OpdsPublicationBase64: "",
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
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<PublicationDocument> = {
        identifier: dbDocIdentifier1,
        title: title1,
        tags: [tag2],
        files: [],
        coverFile: null,
        customCover: null,
        resources: {
            r2PublicationJson: undefined,
            r2LCPJson: undefined,
            r2LSDJson: undefined,
            r2OpdsPublicationJson: undefined,

            // Legacy Base64 data blobs
            //
            // r2PublicationBase64: "",
            // r2LCPBase64: "",
            // r2LSDBase64: "",
            // r2OpdsPublicationBase64: "",
        },
        hash: "",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.title).toBe(title1);
    expect(result.tags).toBeDefined();
    if (result.tags) {
        expect(result.tags.length).toBe(1);
    }
    expect(result.tags).toContain(tag2);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt < result.updatedAt).toBeTruthy();
});

test("repository.delete", async () => {
    if (!db || !repository) {
        return;
    }
    const result = await db.get(dbDocIdentifier1Internal);
    expect(result.identifier).toBe(dbDocIdentifier1);

    // Delete publication 1
    await repository.delete(dbDocIdentifier1);
    try {
        await db.get(dbDocIdentifier1);
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
