import "reflect-metadata";

import * as moment from "moment";

import { ConfigRepository } from "readium-desktop/main/db/repository/config";

import { NotFoundError } from "readium-desktop/main/db/exceptions";

import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: ConfigRepository | null = null;
let db: PouchDB.Database | null = null;
const now = moment.now();

const dbDocIdentifier1 = "key-1";
const dbDoc1 = {
    identifier: dbDocIdentifier1,
    _id: "config_" + dbDocIdentifier1,
    value: "config-value-1",
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "key-2";
const dbDoc2 = {
    identifier: dbDocIdentifier2,
    _id: "config_" + dbDocIdentifier2,
    value: "config-value-2",
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase();
    repository = new ConfigRepository(db);

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

test("repository.get - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.get("key-1");
    expect(result.identifier).toBe("key-1");
    expect(result.value).toBe("config-value-1");
});

test("repository.get - not found", async () => {
    if (!repository) {
        return;
    }
    // Test unknown key
    try {
        await repository.get("key-3");
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
        identifier: "new-key",
        value: "new-value",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-key");
    expect(result.value).toBe("new-value");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    if (!repository) {
        return;
    }
    const dbDoc = {
        identifier: "key-1",
        value: "new-value",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("key-1");
    expect(result.value).toBe("new-value");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt < result.updatedAt).toBeTruthy();
});

test("repository.delete", async () => {
    if (!db || !repository) {
        return;
    }
    const result = await db.get("config_key-1") as any;
    expect(result.identifier).toBe("key-1");

    // Delete key 1
    await repository.delete("key-1");
    try {
        await db.get("config_key-1");
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
