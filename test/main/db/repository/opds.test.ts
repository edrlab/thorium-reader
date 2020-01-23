import "reflect-metadata";

import * as moment from "moment";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { NotFoundError } from "readium-desktop/main/db/exceptions";
import {
    ExcludeTimestampableWithPartialIdentifiable,
} from "readium-desktop/main/db/repository/base";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: OpdsFeedRepository | null = null;
let db: PouchDB.Database<OpdsFeedDocument> | null = null;
const now = moment.now();

const dbDocIdentifier1 = "feed-1";
const dbDocIdentifier1Internal = `opds-feed_${dbDocIdentifier1}`;
const title1 = "Feed 1";
const url1 = "https://feed.org/1";
const dbDoc1: PouchDB.Core.PutDocument<OpdsFeedDocument> = {
    identifier: dbDocIdentifier1,
    _id: dbDocIdentifier1Internal,
    title: title1,
    url: url1,
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "feed-2";
const dbDocIdentifier2Internal = `opds-feed_${dbDocIdentifier2}`;
const dbDoc2: PouchDB.Core.PutDocument<OpdsFeedDocument> = {
    identifier: dbDocIdentifier2,
    _id: dbDocIdentifier2Internal,
    title: "Feed 2",
    url: "https://feed.org/2",
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase<OpdsFeedDocument>();
    repository = new OpdsFeedRepository(db);

    // Create data
    await db.put(dbDoc1);
    await db.put(dbDoc2);
});

afterEach(async () => {
    if (!db) {
        return;
    }
    repository = null;
    await clearDatabase<OpdsFeedDocument>(db);
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
    expect(result.title).toBe(title1);
    expect(result.url).toBe(url1);
});

test("repository.get - not found", async () => {
    if (!repository) {
        return;
    }
    // Test unknown key
    try {
        await repository.get("feed-3");
    } catch (e) {
        expect(e.message).toEqual("document not found");
        expect(e instanceof NotFoundError).toBeTruthy();
    }
});

test("repository.save create", async () => {
    if (!repository) {
        return;
    }
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<OpdsFeedDocument> = {
        identifier: "new-feed",
        title: "New feed",
        url: "https://feed.org/new",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-feed");
    expect(result.title).toBe("New feed");
    expect(result.url).toBe("https://feed.org/new");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    if (!repository) {
        return;
    }
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<OpdsFeedDocument> = {
        identifier: dbDocIdentifier1,
        title: "New feed",
        url: "https://feed.org/new",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.title).toBe("New feed");
    expect(result.url).toBe("https://feed.org/new");
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

    // Delete feed 1
    await repository.delete(dbDocIdentifier1);
    try {
        // tslint:disable-next-line:no-unused-expression
        await db.get(dbDocIdentifier1Internal) as any;
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
