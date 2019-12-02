import "reflect-metadata";

import * as moment from "moment";
import { LocatorType } from "readium-desktop/common/models/locator";
import { LocatorDocument } from "readium-desktop/main/db/document/locator";
import { NotFoundError } from "readium-desktop/main/db/exceptions";
import {
    ExcludeTimestampableWithPartialIdentifiable,
} from "readium-desktop/main/db/repository/base";
import { LocatorRepository } from "readium-desktop/main/db/repository/locator";
import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: LocatorRepository | null = null;
let db: PouchDB.Database<LocatorDocument> | null = null;
const now = moment.now();

const dbDocIdentifier1 = "bookmark-1";
const dbDocIdentifier1Internal = `locator_${dbDocIdentifier1}`;
const publicationIdentifier1 = "pub-1";
const title1 = "Bookmark 1";
const href1 = "/spines/spine-1";
const dbDoc1: PouchDB.Core.PutDocument<LocatorDocument> = {
    identifier: dbDocIdentifier1,
    _id: dbDocIdentifier1Internal,
    locatorType: LocatorType.Bookmark,
    publicationIdentifier: publicationIdentifier1,
    locator: {
        href: href1,
        title: title1,
        locations: {
            position: 12,
        },
    },
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "bookmark-2";
const dbDocIdentifier2Internal = `locator_${dbDocIdentifier2}`;
const publicationIdentifier2 = "pub-2";
const dbDoc2: PouchDB.Core.PutDocument<LocatorDocument> = {
    identifier: dbDocIdentifier2,
    _id: dbDocIdentifier2Internal,
    locatorType: LocatorType.Bookmark,
    publicationIdentifier: publicationIdentifier2,
    locator: {
        href: "/spines/spine-2",
        title: "Bookmark 2",
        locations: {
            position: 38,
        },
    },
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase<LocatorDocument>();
    repository = new LocatorRepository(db);

    // Create data
    await db.put(dbDoc1);
    await db.put(dbDoc2);
});

afterEach(async () => {
    if (!db) {
        return;
    }
    repository = null;
    await clearDatabase<LocatorDocument>(db);
});

test("repository.findAll", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findAll();
    expect(result.length).toBe(2);
});

test("repository.findByPublicationIdentifer - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByPublicationIdentifier(publicationIdentifier1);
    expect(result.length).toBe(1);
    const locator = result[0];
    expect(locator.identifier).toBe(dbDocIdentifier1);
    expect(locator.locatorType).toBe(LocatorType.Bookmark);
    expect(locator.publicationIdentifier).toBe(publicationIdentifier1);
    expect(locator.locator.href).toBe(href1);
    expect(locator.locator.title).toBe(title1);
});
test("repository.findByPublicationIdentifer - not found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByPublicationIdentifier("pub-3");
    expect(result.length).toBe(0);
});

test("repository.findByLocatorType - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByLocatorType(LocatorType.Bookmark);
    expect(result.length).toBe(2);
});

test("repository.findByLocatorType - not found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByLocatorType(LocatorType.LastReadingLocation);
    expect(result.length).toBe(0);
});

test("repository.findByPublicationIdentifer - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByPublicationIdentifierAndLocatorType(
        publicationIdentifier1, LocatorType.Bookmark,
    );
    expect(result.length).toBe(1);
    const locator = result[0];
    expect(locator.identifier).toBe(dbDocIdentifier1);
    expect(locator.locatorType).toBe(LocatorType.Bookmark);
    expect(locator.publicationIdentifier).toBe(publicationIdentifier1);
    expect(locator.locator.href).toBe(href1);
    expect(locator.locator.title).toBe(title1);
});

test("repository.findByPublicationIdentifer - not found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByPublicationIdentifierAndLocatorType(
        publicationIdentifier1, LocatorType.LastReadingLocation,
    );
    expect(result.length).toBe(0);
});

test("repository.get - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.get(dbDocIdentifier1);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.locatorType).toBe(LocatorType.Bookmark);
    expect(result.publicationIdentifier).toBe(publicationIdentifier1);
    expect(result.locator.href).toBe(href1);
    expect(result.locator.title).toBe(title1);
    expect(result.locator.locations.position).toBe(12);
});

test("repository.get - not found", async () => {
    if (!repository) {
        return;
    }
    // Test unknown key
    try {
        await repository.get("bookmark-3");
    } catch (e) {
        expect(e.message).toEqual("document not found");
        expect(e instanceof NotFoundError).toBeTruthy();
    }
});

test("repository.save create", async () => {
    if (!repository) {
        return;
    }
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<LocatorDocument> = {
        identifier: "new-bookmark",
        locatorType: LocatorType.LastReadingLocation,
        publicationIdentifier: publicationIdentifier1,
        locator: {
            href: "/spines/spine-3",
            locations: {
                position: 138,
            },
        },
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-bookmark");
    expect(result.locatorType).toBe(LocatorType.LastReadingLocation);
    expect(result.publicationIdentifier).toBe(publicationIdentifier1);
    expect(result.locator.href).toBe("/spines/spine-3");
    expect(result.locator.locations.position).toBe(138);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    if (!repository) {
        return;
    }
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<LocatorDocument> = {
        identifier: dbDocIdentifier1,
        locatorType: LocatorType.Bookmark,
        publicationIdentifier: publicationIdentifier1,
        locator: {
            href: href1,
            title: "New bookmark",
            locations: {
                position: 12,
            },
        },
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.locatorType).toBe(LocatorType.Bookmark);
    expect(result.publicationIdentifier).toBe(publicationIdentifier1);
    expect(result.locator.href).toBe(href1);
    expect(result.locator.title).toBe("New bookmark");
    expect(result.locator.locations.position).toBe(12);
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

    // Delete locator 1
    await repository.delete(dbDocIdentifier1);
    try {
        await db.get(dbDocIdentifier1);
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
