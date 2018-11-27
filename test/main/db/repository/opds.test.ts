import "reflect-metadata";

import * as moment from "moment";
import * as PouchDB from "pouchdb-core";

import { OpdsRepository } from "readium-desktop/main/db/repository/opds";
import { NotFoundError } from "readium-desktop/main/db/exceptions";

import { clearDatabase, createDatabase,  } from "test/main/db/utils";

let repository: OpdsRepository = null;
let db: PouchDB.Database = null;
const now = moment.now();

const dbDocIdentifier1 = "feed-1";
const dbDoc1 = {
    identifier: dbDocIdentifier1,
    _id: "opds_" + dbDocIdentifier1,
    name: "Feed 1",
    url: "https://feed.org/1",
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "feed-2";
const dbDoc2 = {
    identifier: dbDocIdentifier2,
    _id: "opds_" + dbDocIdentifier2,
    name: "Feed 2",
    url: "https://feed.org/2",
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase();
    repository = new OpdsRepository(db);

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

test("repository.get - found", async () => {
    const result = await repository.get("feed-1");
    expect(result.identifier).toBe("feed-1");
    expect(result.name).toBe("Feed 1");
    expect(result.url).toBe("https://feed.org/1");
});

test("repository.get - not found", async () => {
    // Test unknown key
    try {
        await repository.get("feed-3");
    } catch (e) {
        expect(e.message).toEqual("document not found");
        expect(e instanceof NotFoundError).toBeTruthy();
    }
});

test("repository.save create", async () => {
    const dbDoc = {
        identifier: "new-feed",
        name: "New feed",
        url: "https://feed.org/new"
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-feed");
    expect(result.name).toBe("New feed");
    expect(result.url).toBe("https://feed.org/new");
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    const dbDoc = {
        identifier: "feed-1",
        name: "New feed",
        url: "https://feed.org/new"
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("feed-1");
    expect(result.name).toBe("New feed");
    expect(result.url).toBe("https://feed.org/new");
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt < result.updatedAt).toBeTruthy();
});

test("repository.delete", async () => {
    let result = await db.get("opds_feed-1") as any;
    expect(result.identifier).toBe("feed-1");

    // Delete feed 1
    await repository.delete("feed-1");
    try {
        await db.get("opds_feed-1") as any;
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
