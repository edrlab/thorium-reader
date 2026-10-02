import * as fs from "node:fs";
import * as mockOs from "node:os";
import * as mockPath from "node:path";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("electron", () => ({
    dialog: {
        showMessageBox: async (): Promise<void> => undefined,
    },
}));

jest.mock("inversify", () => ({
    injectable:
        () =>
        <T>(target: T): T =>
            target,
}));

jest.mock("../../../src/main/di", () => ({
    userPublicationDirectoryConfigPath: mockPath.join(
        mockOs.tmpdir(),
        "thorium-publication-storage-cover-test-config.json",
    ),
}));

jest.mock("@r2-shared-js/parser/publication-parser", () => ({
    PublicationParsePromise: async (): Promise<{
        freeDestroy: () => void;
        GetCover: () => undefined;
        Internal: unknown[];
    }> => ({
        freeDestroy: (): void => undefined,
        GetCover: (): undefined => undefined,
        Internal: [],
    }),
}));

import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";

const identifier = "11111111-1111-1111-1111-111111111111";

describe("PublicationStorage.storePublicationCoverData", () => {
    let publicationPath: string;
    let rootPath: string;
    let storage: PublicationStorage;

    beforeEach(async () => {
        rootPath = await fs.promises.mkdtemp(mockPath.join(mockOs.tmpdir(), "thorium-publication-cover-"));
        publicationPath = mockPath.join(rootPath, identifier);
        storage = new PublicationStorage(rootPath);

        await storage.ready();
        await fs.promises.mkdir(publicationPath);
    });

    afterEach(async () => {
        await fs.promises.rm(rootPath, { force: true, recursive: true });
    });

    it("stores an external publication cover with local file metadata", async () => {
        const coverContent = Buffer.from("opds cover bytes");

        await expect(
            storage.storePublicationCoverData(identifier, {
                buffer: coverContent,
                contentType: "image/png",
                ext: "png",
            }),
        ).resolves.toEqual({
            contentType: "image/png",
            ext: "png",
            size: coverContent.length,
            url: `store://${identifier}/cover.png`,
        });
        expect(await fs.promises.readFile(mockPath.join(publicationPath, "cover.png"))).toEqual(coverContent);
    });

    it("rejects invalid external publication cover metadata", async () => {
        await expect(
            storage.storePublicationCoverData(identifier, {
                buffer: Buffer.from("not an image"),
                contentType: "text/plain",
                ext: "txt",
            }),
        ).rejects.toThrow("Invalid publication cover data");
    });
});
