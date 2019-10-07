import "reflect-metadata";

import * as moment from "moment";

import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";

import { NotFoundError } from "readium-desktop/main/db/exceptions";

import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: LcpSecretRepository | null = null;
let db: PouchDB.Database | null = null;
const now = moment.now();

const dbDocIdentifier1 = "lcp-secret-1";
const dbPubIdentifier1 = "pub-1";
const dbDoc1 = {
    identifier: dbDocIdentifier1,
    _id: "lcp_secret_" + dbDocIdentifier1,
    publicationIdentifier: dbPubIdentifier1,
    secret: "secret-1",
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "lcp-secret-2";
const dbPubIdentifier2 = "pub-2";
const dbDoc2 = {
    identifier: dbDocIdentifier2,
    _id: "lcp_secret_" + dbDocIdentifier2,
    publicationIdentifier: dbPubIdentifier2,
    secret: "secret-2",
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase();
    repository = new LcpSecretRepository(db);

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

test("repository.findByPublicationIdentifier - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByPublicationIdentifier("pub-1");
    expect(result.length).toBe(1);
    const lcpSecret = result[0];
    expect(lcpSecret.identifier).toBe("lcp-secret-1");
    expect(lcpSecret.publicationIdentifier).toBe("pub-1");
    expect(lcpSecret.secret).toBe("secret-1");
});

test("repository.findByPublicationIdentifier - not found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByPublicationIdentifier("unknown");
    expect(result.length).toBe(0);
});

test("repository.get - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.get("lcp-secret-1");
    expect(result.identifier).toBe("lcp-secret-1");
    expect(result.publicationIdentifier).toBe("pub-1");
    expect(result.secret).toBe("secret-1");
});

test("repository.get - not found", async () => {
    if (!repository) {
        return;
    }
    // Test unknown key
    try {
        await repository.get("lcp-secret-3");
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
        identifier: "new-lcp-secret",
        _id: "lcp_secret_new-lcp-secret",
        publicationIdentifier: dbPubIdentifier2,
        secret: "secret-3",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-lcp-secret");
    expect(result.publicationIdentifier).toBe("pub-2");
    expect(result.secret).toBe("secret-3");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    if (!repository) {
        return;
    }
    const dbDoc = {
        identifier: "lcp-secret-1",
        publicationIdentifier: dbPubIdentifier1,
        secret: "updated-secret",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("lcp-secret-1");
    expect(result.publicationIdentifier).toBe("pub-1");
    expect(result.secret).toBe("updated-secret");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt < result.updatedAt).toBeTruthy();
});

test("repository.delete", async () => {
    if (!db || !repository) {
        return;
    }
    const result = await db.get("lcp_secret_lcp-secret-1") as any;
    expect(result.identifier).toBe("lcp-secret-1");

    // Delete publication 1
    await repository.delete("lcp-secret-1");
    try {
        await db.get("lcp_secret_lcp-secret-1");
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
