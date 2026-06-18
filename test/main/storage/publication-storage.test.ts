import * as fs from "fs";
import * as mockOs from "os";
import * as mockPath from "path";
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

jest.mock("../../../src/main/di", () => {
    return {
        userPublicationDirectoryConfigPath: mockPath.join(
            mockOs.tmpdir(),
            "thorium-publication-storage-test-config.json",
        ),
    };
});

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
const oldBookContent = "old publication archive bytes";
const newBookContent = "new publication archive bytes";

const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.promises.access(filePath);
        return true;
    } catch {
        return false;
    }
};

const readUtf8 = (filePath: string): Promise<string> => fs.promises.readFile(filePath, "utf-8");

const listReplacementScratchFiles = async (directoryPath: string): Promise<string[]> =>
    (await fs.promises.readdir(directoryPath)).filter((fileName) => fileName.startsWith("__thorium-")).sort();

describe("PublicationStorage.replacePublicationFiles", () => {
    let rootPath: string;
    let publicationPath: string;
    let sourcePath: string;
    let storage: PublicationStorage;

    beforeEach(async () => {
        rootPath = await fs.promises.mkdtemp(mockPath.join(mockOs.tmpdir(), "thorium-publication-storage-"));
        publicationPath = mockPath.join(rootPath, identifier);
        sourcePath = mockPath.join(rootPath, "updated.epub");
        storage = new PublicationStorage(rootPath);

        await storage.ready();
        await fs.promises.mkdir(publicationPath);
        await fs.promises.writeFile(mockPath.join(publicationPath, "book.epub"), oldBookContent);
        await fs.promises.writeFile(mockPath.join(publicationPath, "cover.jpg"), "old cover");
        await fs.promises.writeFile(mockPath.join(publicationPath, "manifest.json"), "old manifest");
        await fs.promises.writeFile(mockPath.join(publicationPath, "license.lcpl"), "old license");
        await fs.promises.writeFile(mockPath.join(publicationPath, "notes.json"), "unmanaged notes");
        await fs.promises.writeFile(sourcePath, newBookContent);
    });

    afterEach(async () => {
        await fs.promises.rm(rootPath, { force: true, recursive: true });
    });

    it("rolls back the archive replacement and restores managed files", async () => {
        const replacement = await storage.replacePublicationFiles(identifier, sourcePath);

        expect(replacement.files).toEqual([
            {
                contentType: "application/epub+zip",
                ext: "epub",
                size: Buffer.byteLength(newBookContent),
                url: `store://${identifier}/book.epub`,
            },
        ]);
        expect(await readUtf8(mockPath.join(publicationPath, "book.epub"))).toBe(newBookContent);
        expect(await fileExists(mockPath.join(publicationPath, "cover.jpg"))).toBe(false);
        expect(await fileExists(mockPath.join(publicationPath, "manifest.json"))).toBe(false);
        expect(await fileExists(mockPath.join(publicationPath, "license.lcpl"))).toBe(false);
        expect(await readUtf8(mockPath.join(publicationPath, "notes.json"))).toBe("unmanaged notes");

        await replacement.rollback();
        await replacement.rollback();

        expect(await readUtf8(mockPath.join(publicationPath, "book.epub"))).toBe(oldBookContent);
        expect(await readUtf8(mockPath.join(publicationPath, "cover.jpg"))).toBe("old cover");
        expect(await readUtf8(mockPath.join(publicationPath, "manifest.json"))).toBe("old manifest");
        expect(await readUtf8(mockPath.join(publicationPath, "license.lcpl"))).toBe("old license");
        expect(await readUtf8(mockPath.join(publicationPath, "notes.json"))).toBe("unmanaged notes");
        expect(await listReplacementScratchFiles(publicationPath)).toEqual([]);
    });

    it("finalizes the archive replacement and removes backups", async () => {
        const replacement = await storage.replacePublicationFiles(identifier, sourcePath);

        await replacement.finalize();
        await replacement.finalize();

        expect(await readUtf8(mockPath.join(publicationPath, "book.epub"))).toBe(newBookContent);
        expect(await fileExists(mockPath.join(publicationPath, "cover.jpg"))).toBe(false);
        expect(await fileExists(mockPath.join(publicationPath, "manifest.json"))).toBe(false);
        expect(await fileExists(mockPath.join(publicationPath, "license.lcpl"))).toBe(false);
        expect(await readUtf8(mockPath.join(publicationPath, "notes.json"))).toBe("unmanaged notes");
        expect(await listReplacementScratchFiles(publicationPath)).toEqual([]);
    });

    it("keeps original files when backup fails before promotion", async () => {
        const renameSpy = jest.spyOn(fs.promises, "rename");
        renameSpy.mockImplementationOnce(async () => {
            throw new Error("backup failed");
        });

        try {
            await expect(storage.replacePublicationFiles(identifier, sourcePath)).rejects.toThrow("backup failed");
        } finally {
            renameSpy.mockRestore();
        }

        expect(await readUtf8(mockPath.join(publicationPath, "book.epub"))).toBe(oldBookContent);
        expect(await readUtf8(mockPath.join(publicationPath, "cover.jpg"))).toBe("old cover");
        expect(await readUtf8(mockPath.join(publicationPath, "manifest.json"))).toBe("old manifest");
        expect(await readUtf8(mockPath.join(publicationPath, "license.lcpl"))).toBe("old license");
        expect(await readUtf8(mockPath.join(publicationPath, "notes.json"))).toBe("unmanaged notes");
        expect(await listReplacementScratchFiles(publicationPath)).toEqual([]);
    });

    it("can retry finalize when backup cleanup fails", async () => {
        const replacement = await storage.replacePublicationFiles(identifier, sourcePath);
        const rmSpy = jest.spyOn(fs.promises, "rm");
        rmSpy.mockImplementationOnce(async () => {
            throw new Error("backup cleanup failed");
        });

        try {
            await expect(replacement.finalize()).rejects.toThrow("backup cleanup failed");
        } finally {
            rmSpy.mockRestore();
        }

        await replacement.finalize();

        expect(await readUtf8(mockPath.join(publicationPath, "book.epub"))).toBe(newBookContent);
        expect(await listReplacementScratchFiles(publicationPath)).toEqual([]);
    });

    it("can retry rollback when restoring a backup fails", async () => {
        const replacement = await storage.replacePublicationFiles(identifier, sourcePath);
        const renameSpy = jest.spyOn(fs.promises, "rename");
        renameSpy.mockImplementationOnce(async () => {
            throw new Error("restore failed");
        });

        try {
            await expect(replacement.rollback()).rejects.toThrow("rollbackPublicationFilesReplacement failed");
        } finally {
            renameSpy.mockRestore();
        }

        await replacement.rollback();

        expect(await readUtf8(mockPath.join(publicationPath, "book.epub"))).toBe(oldBookContent);
        expect(await readUtf8(mockPath.join(publicationPath, "cover.jpg"))).toBe("old cover");
        expect(await readUtf8(mockPath.join(publicationPath, "manifest.json"))).toBe("old manifest");
        expect(await readUtf8(mockPath.join(publicationPath, "license.lcpl"))).toBe("old license");
        expect(await readUtf8(mockPath.join(publicationPath, "notes.json"))).toBe("unmanaged notes");
        expect(await listReplacementScratchFiles(publicationPath)).toEqual([]);
    });
});
