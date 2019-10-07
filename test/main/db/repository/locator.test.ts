import "reflect-metadata";

import * as moment from "moment";

import { LocatorType } from "readium-desktop/common/models/locator";

import { LocatorRepository } from "readium-desktop/main/db/repository/locator";

import { NotFoundError } from "readium-desktop/main/db/exceptions";

import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: LocatorRepository | null = null;
let db: PouchDB.Database | null = null;
const now = moment.now();

const dbDocIdentifier1 = "bookmark-1";
const dbDoc1 = {
    identifier: dbDocIdentifier1,
    _id: "locator_" + dbDocIdentifier1,
    locatorType: LocatorType.Bookmark,
    publicationIdentifier: "pub-1",
    locator: {
        href: "/spines/spine-1",
        title: "Bookmark 1",
        locations: {
            position: 12,
        },
    },
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "bookmark-2";
const dbDoc2 = {
    identifier: dbDocIdentifier2,
    _id: "locator_" + dbDocIdentifier2,
    locatorType: LocatorType.Bookmark,
    publicationIdentifier: "pub-2",
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
    db = createDatabase();
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
    await clearDatabase(db);
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
    const result = await repository.findByPublicationIdentifier("pub-1");
    expect(result.length).toBe(1);
    const locator = result[0];
    expect(locator.identifier).toBe("bookmark-1");
    expect(locator.locatorType).toBe(LocatorType.Bookmark);
    expect(locator.publicationIdentifier).toBe("pub-1");
    expect(locator.locator.href).toBe("/spines/spine-1");
    expect(locator.locator.title).toBe("Bookmark 1");
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
        "pub-1", LocatorType.Bookmark,
    );
    expect(result.length).toBe(1);
    const locator = result[0];
    expect(locator.identifier).toBe("bookmark-1");
    expect(locator.locatorType).toBe(LocatorType.Bookmark);
    expect(locator.publicationIdentifier).toBe("pub-1");
    expect(locator.locator.href).toBe("/spines/spine-1");
    expect(locator.locator.title).toBe("Bookmark 1");
});

test("repository.findByPublicationIdentifer - not found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.findByPublicationIdentifierAndLocatorType(
        "pub-1", LocatorType.LastReadingLocation,
    );
    expect(result.length).toBe(0);
});

test("repository.get - found", async () => {
    if (!repository) {
        return;
    }
    const result = await repository.get("bookmark-1");
    expect(result.identifier).toBe("bookmark-1");
    expect(result.locatorType).toBe(LocatorType.Bookmark);
    expect(result.publicationIdentifier).toBe("pub-1");
    expect(result.locator.href).toBe("/spines/spine-1");
    expect(result.locator.title).toBe("Bookmark 1");
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
    const dbDoc = {
        identifier: "new-bookmark",
        locatorType: LocatorType.LastReadingLocation,
        publicationIdentifier: "pub-1",
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
    expect(result.publicationIdentifier).toBe("pub-1");
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
    const dbDoc = {
        identifier: "bookmark-1",
        locatorType: LocatorType.Bookmark,
        publicationIdentifier: "pub-1",
        locator: {
            href: "/spines/spine-1",
            title: "New bookmark",
            locations: {
                position: 12,
            },
        },
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("bookmark-1");
    expect(result.locatorType).toBe(LocatorType.Bookmark);
    expect(result.publicationIdentifier).toBe("pub-1");
    expect(result.locator.href).toBe("/spines/spine-1");
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
    const result = await db.get("locator_bookmark-1") as any;
    expect(result.identifier).toBe("bookmark-1");

    // Delete locator 1
    await repository.delete("bookmark-1");
    try {
        await db.get("bookmark-1");
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
