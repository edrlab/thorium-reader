import { afterEach, expect, test } from "@jest/globals";
import * as fs from "node:fs";
import * as os from "node:os";
import path from "node:path";
import { ZipFile } from "yazl";

import { readAnnotationSetFile } from "readium-desktop/main/w3c/annotations/read";
import { createDetachedAnnotationPackage } from "readium-desktop/renderer/common/redux/sagas/readiumAnnotation/detachedPackage";

const tempDirectories: string[] = [];

afterEach(async () => {
    await Promise.all(tempDirectories.splice(0).map((directory) =>
        fs.promises.rm(directory, { force: true, recursive: true }),
    ));
});

async function createTempDirectory(): Promise<string> {
    const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "thorium-annotations-"));
    tempDirectories.push(directory);
    return directory;
}

function createZipWithEntry(entryName: string, contents: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const zipFile = new ZipFile();
        const chunks: Buffer[] = [];

        zipFile.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
        zipFile.outputStream.once("error", reject);
        zipFile.outputStream.once("end", () => resolve(Buffer.concat(chunks)));
        zipFile.addBuffer(Buffer.from(contents, "utf8"), entryName);
        zipFile.end();
    });
}

test("detached annotation packages contain a root-level annotations.json", async () => {
    const serializedAnnotationSet = JSON.stringify({ type: "AnnotationSet", items: [] });
    const archive = await createDetachedAnnotationPackage(serializedAnnotationSet);
    const directory = await createTempDirectory();
    const filePath = path.join(directory, "export.annotations");
    await fs.promises.writeFile(filePath, Buffer.from(archive));

    await expect(readAnnotationSetFile(filePath)).resolves.toBe(serializedAnnotationSet);
});

test("legacy raw annotation files remain readable", async () => {
    const serializedAnnotationSet = JSON.stringify({ type: "AnnotationSet", items: [] });
    const directory = await createTempDirectory();
    const filePath = path.join(directory, "legacy.annotation");
    await fs.promises.writeFile(filePath, serializedAnnotationSet, "utf8");

    await expect(readAnnotationSetFile(filePath)).resolves.toBe(serializedAnnotationSet);
});

test("detached annotation packages require annotations.json at the archive root", async () => {
    const directory = await createTempDirectory();
    const filePath = path.join(directory, "invalid.annotations");
    await fs.promises.writeFile(filePath, await createZipWithEntry("nested/annotations.json", "{}"));

    await expect(readAnnotationSetFile(filePath)).rejects.toThrow("root-level annotations.json");
});

test("malformed detached annotation packages are rejected", async () => {
    const directory = await createTempDirectory();
    const filePath = path.join(directory, "malformed.annotations");
    await fs.promises.writeFile(filePath, "not a ZIP archive", "utf8");

    await expect(readAnnotationSetFile(filePath)).rejects.toThrow();
});
