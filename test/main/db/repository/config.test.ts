import "reflect-metadata";

import * as moment from "moment";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { NotFoundError } from "readium-desktop/main/db/exceptions";
import {
    ExcludeTimestampableWithPartialIdentifiable,
} from "readium-desktop/main/db/repository/base";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { clearDatabase, createDatabase } from "test/main/db/utils";

type ConfigType = string;

let repository: ConfigRepository<ConfigType> | null = null;
let db: PouchDB.Database<ConfigDocument<ConfigType>> | null = null;
const now = moment.now();

const dbDocIdentifier1 = "key-1";
const dbDocIdentifier1Internal = `config_${dbDocIdentifier1}`;
const configVal1 = "config-value-1";
const dbDoc1: PouchDB.Core.PutDocument<ConfigDocument<ConfigType>> = {
    identifier: dbDocIdentifier1,
    _id: dbDocIdentifier1Internal,
    value: configVal1,
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "key-2";
const dbDocIdentifier2Internal = `config_${dbDocIdentifier2}`;
const configVal2 = "config-value-2";
const dbDoc2: PouchDB.Core.PutDocument<ConfigDocument<ConfigType>> = {
    identifier: dbDocIdentifier2,
    _id: dbDocIdentifier2Internal,
    value: configVal2,
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase<ConfigDocument<ConfigType>>();
    repository = new ConfigRepository<ConfigType>(db);

    // Create data
    await db.put(dbDoc1);
    await db.put(dbDoc2);
});

afterEach(async () => {
    if (!db) {
        return;
    }
    repository = null;
    await clearDatabase<ConfigDocument<ConfigType>>(db);
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
    const result = await repository.get(dbDocIdentifier1);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.value).toBe(configVal1);
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
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<ConfigDocument<ConfigType>> = {
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
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<ConfigDocument<ConfigType>> = {
        identifier: dbDocIdentifier1,
        value: "new-value",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.value).toBe("new-value");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt < result.updatedAt).toBeTruthy();
});

test("repository.delete", async () => {
    if (!db || !repository) {
        return;
    }
    const result = await db.get(dbDocIdentifier1Internal) as any;
    expect(result.identifier).toBe(dbDocIdentifier1);

    // Delete key 1
    await repository.delete(dbDocIdentifier1);
    try {
        await db.get(dbDocIdentifier1Internal);
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
