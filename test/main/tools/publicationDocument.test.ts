import { describe, expect, it } from "@jest/globals";

import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { File } from "readium-desktop/common/models/file";
import { buildPublicationFilesDocumentPatch } from "readium-desktop/main/tools/publicationDocument";

const publicationFile = (url: string, contentType: string, ext: string): File => ({
    contentType,
    ext,
    size: 42,
    url,
});

describe("publicationDocument", () => {
    it("splits archive files from the cover file and clears custom covers when a real cover exists", () => {
        const book = publicationFile("thoriumhttps://book.epub", "application/epub+zip", "epub");
        const manifest = publicationFile("thoriumhttps://manifest.json", "application/webpub+json", "json");
        const cover = publicationFile("thoriumhttps://cover.jpg", "image/jpeg", "jpg");
        const existingCustomCover = RandomCustomCovers[0];

        expect(buildPublicationFilesDocumentPatch([book, cover, manifest], existingCustomCover)).toEqual({
            coverFile: cover,
            customCover: undefined,
            files: [book, manifest],
        });
    });

    it("preserves the existing custom cover when no cover file is present", () => {
        const book = publicationFile("thoriumhttps://book.epub", "application/epub+zip", "epub");
        const existingCustomCover = RandomCustomCovers[1];

        expect(buildPublicationFilesDocumentPatch([book], existingCustomCover)).toEqual({
            coverFile: undefined,
            customCover: existingCustomCover,
            files: [book],
        });
    });

    it("generates a custom cover when no cover file or existing custom cover is present", () => {
        const book = publicationFile("thoriumhttps://book.epub", "application/epub+zip", "epub");
        const patch = buildPublicationFilesDocumentPatch([book]);

        expect(patch.coverFile).toBeUndefined();
        expect(patch.files).toEqual([book]);
        expect(RandomCustomCovers).toContain(patch.customCover);
    });

    it("does not mutate the source file list", () => {
        const book = publicationFile("thoriumhttps://book.epub", "application/epub+zip", "epub");
        const cover = publicationFile("thoriumhttps://cover.svg", "image/svg+xml", "svg");
        const publicationFiles = [book, cover];

        const patch = buildPublicationFilesDocumentPatch(publicationFiles);

        expect(publicationFiles).toEqual([book, cover]);
        expect(patch.files).not.toBe(publicationFiles);
    });

    it("uses undefined instead of null for absent optional patch values", () => {
        const book = publicationFile("thoriumhttps://book.epub", "application/epub+zip", "epub");
        const cover = publicationFile("thoriumhttps://cover.png", "image/png", "png");

        expect(buildPublicationFilesDocumentPatch([book, cover])).toEqual({
            coverFile: cover,
            customCover: undefined,
            files: [book],
        });
    });
});
