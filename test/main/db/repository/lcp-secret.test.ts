import "reflect-metadata";

import * as moment from "moment";
import { LcpSecretDocument } from "readium-desktop/main/db/document/lcp-secret";
import { NotFoundError } from "readium-desktop/main/db/exceptions";
import {
    ExcludeTimestampableWithPartialIdentifiable,
} from "readium-desktop/main/db/repository/base";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { clearDatabase, createDatabase } from "test/main/db/utils";

let repository: LcpSecretRepository | null = null;
let db: PouchDB.Database<LcpSecretDocument> | null = null;
const now = moment.now();

const dbDocIdentifier1 = "lcp-secret-1";
const dbDocIdentifier1Internal = `lcp_secret_${dbDocIdentifier1}`;
const dbPubIdentifier1 = "pub-1";
const secret1 = "secret-1";
const dbDoc1: PouchDB.Core.PutDocument<LcpSecretDocument> = {
    identifier: dbDocIdentifier1,
    _id: dbDocIdentifier1Internal,
    publicationIdentifier: dbPubIdentifier1,
    secret: secret1,
    createdAt: now,
    updatedAt: now,
};

const dbDocIdentifier2 = "lcp-secret-2";
const dbDocIdentifier2Internal = `lcp_secret_${dbDocIdentifier2}`;
const dbPubIdentifier2 = "pub-2";
const secret2 = "secret-2";
const dbDoc2: PouchDB.Core.PutDocument<LcpSecretDocument> = {
    identifier: dbDocIdentifier2,
    _id: dbDocIdentifier2Internal,
    publicationIdentifier: dbPubIdentifier2,
    secret: secret2,
    createdAt: now,
    updatedAt: now,
};

beforeEach(async () => {
    db = createDatabase<LcpSecretDocument>();
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
    await clearDatabase<LcpSecretDocument>(db);
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
    const result = await repository.findByPublicationIdentifier(dbPubIdentifier1);
    expect(result.length).toBe(1);
    const lcpSecret = result[0];
    expect(lcpSecret.identifier).toBe(dbDocIdentifier1);
    expect(lcpSecret.publicationIdentifier).toBe(dbPubIdentifier1);
    expect(lcpSecret.secret).toBe(secret1);
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
    const result = await repository.get(dbDocIdentifier1);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.publicationIdentifier).toBe(dbPubIdentifier1);
    expect(result.secret).toBe(secret1);
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
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<LcpSecretDocument> = { //  & PouchDB.Core.IdMeta
        identifier: "new-lcp-secret",
        // _id: "lcp_secret_new-lcp-secret",
        publicationIdentifier: dbPubIdentifier2,
        secret: "secret-3",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe("new-lcp-secret");
    expect(result.publicationIdentifier).toBe(dbPubIdentifier2);
    expect(result.secret).toBe("secret-3");
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt === result.updatedAt).toBeTruthy();
});

test("repository.save update", async () => {
    if (!repository) {
        return;
    }
    const dbDoc: ExcludeTimestampableWithPartialIdentifiable<LcpSecretDocument> = {
        identifier: dbDocIdentifier1,
        publicationIdentifier: dbPubIdentifier1,
        secret: "updated-secret",
    };
    const result = await repository.save(dbDoc);
    expect(result.identifier).toBe(dbDocIdentifier1);
    expect(result.publicationIdentifier).toBe(dbPubIdentifier1);
    expect(result.secret).toBe("updated-secret");
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

    // Delete publication 1
    await repository.delete(dbDocIdentifier1);
    try {
        await db.get(dbDocIdentifier1Internal);
    } catch (e) {
        expect(e.message).toBe("missing");
    }
});
