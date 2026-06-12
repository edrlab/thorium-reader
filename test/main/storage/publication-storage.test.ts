import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("electron", () => ({
    dialog: {
        showMessageBox: async (): Promise<void> => undefined,
    },
}));

jest.mock("inversify", () => ({
    injectable: () => <T>(target: T): T => target,
}));

jest.mock("../../../src/main/di", () => {
    const osModule = require("os");
    const pathModule = require("path");

    return {
        userPublicationDirectoryConfigPath: pathModule.join(
            osModule.tmpdir(),
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

const readUtf8 = (filePath: string): Promise<string> =>
    fs.promises.readFile(filePath, "utf-8");

const listReplacementScratchFiles = async (directoryPath: string): Promise<string[]> =>
    (await fs.promises.readdir(directoryPath))
        .filter((fileName) => fileName.startsWith("__thorium-"))
        .sort();

describe("PublicationStorage.replacePublicationFiles", () => {
    let rootPath: string;
    let publicationPath: string;
    let sourcePath: string;
    let storage: PublicationStorage;

    beforeEach(async () => {
        rootPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), "thorium-publication-storage-"));
        publicationPath = path.join(rootPath, identifier);
        sourcePath = path.join(rootPath, "updated.epub");
        storage = new PublicationStorage(rootPath);

        await storage.ready();
        await fs.promises.mkdir(publicationPath);
        await fs.promises.writeFile(path.join(publicationPath, "book.epub"), oldBookContent);
        await fs.promises.writeFile(path.join(publicationPath, "cover.jpg"), "old cover");
        await fs.promises.writeFile(path.join(publicationPath, "manifest.json"), "old manifest");
        await fs.promises.writeFile(path.join(publicationPath, "license.lcpl"), "old license");
        await fs.promises.writeFile(path.join(publicationPath, "notes.json"), "unmanaged notes");
        await fs.promises.writeFile(sourcePath, newBookContent);
    });

    afterEach(async () => {
        await fs.promises.rm(rootPath, { force: true, recursive: true });
    });

    it("rolls back the archive replacement and restores managed files", async () => {
        const replacement = await storage.replacePublicationFiles(identifier, sourcePath);

        expect(replacement.files).toEqual([{
            contentType: "application/epub+zip",
            ext: "epub",
            size: Buffer.byteLength(newBookContent),
            url: `store://${identifier}/book.epub`,
        }]);
        expect(await readUtf8(path.join(publicationPath, "book.epub"))).toBe(newBookContent);
        expect(await fileExists(path.join(publicationPath, "cover.jpg"))).toBe(false);
        expect(await fileExists(path.join(publicationPath, "manifest.json"))).toBe(false);
        expect(await fileExists(path.join(publicationPath, "license.lcpl"))).toBe(false);
        expect(await readUtf8(path.join(publicationPath, "notes.json"))).toBe("unmanaged notes");

        await replacement.rollback();
        await replacement.rollback();

        expect(await readUtf8(path.join(publicationPath, "book.epub"))).toBe(oldBookContent);
        expect(await readUtf8(path.join(publicationPath, "cover.jpg"))).toBe("old cover");
        expect(await readUtf8(path.join(publicationPath, "manifest.json"))).toBe("old manifest");
        expect(await readUtf8(path.join(publicationPath, "license.lcpl"))).toBe("old license");
        expect(await readUtf8(path.join(publicationPath, "notes.json"))).toBe("unmanaged notes");
        expect(await listReplacementScratchFiles(publicationPath)).toEqual([]);
    });

    it("finalizes the archive replacement and removes backups", async () => {
        const replacement = await storage.replacePublicationFiles(identifier, sourcePath);

        await replacement.finalize();
        await replacement.finalize();

        expect(await readUtf8(path.join(publicationPath, "book.epub"))).toBe(newBookContent);
        expect(await fileExists(path.join(publicationPath, "cover.jpg"))).toBe(false);
        expect(await fileExists(path.join(publicationPath, "manifest.json"))).toBe(false);
        expect(await fileExists(path.join(publicationPath, "license.lcpl"))).toBe(false);
        expect(await readUtf8(path.join(publicationPath, "notes.json"))).toBe("unmanaged notes");
        expect(await listReplacementScratchFiles(publicationPath)).toEqual([]);
    });
});
