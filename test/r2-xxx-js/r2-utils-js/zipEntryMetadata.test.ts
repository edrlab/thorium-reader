import { expect, test } from "@jest/globals";
import * as path from "node:path";

import { Zip1 } from "@r2-utils-js/_utils/zip/zip1";
import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";

const epubPath = path.join(
    process.cwd(),
    "test/customization/profile/thorium_university_press/publications/jaune.epub",
);

test("reads stored and deflated entry lengths without opening their streams", async () => {
    const zip = await Zip1.loadPromise(epubPath);

    try {
        expect(zip.entryMetadata("mimetype")).toEqual({
            entryLength: 22,
            isEntryCompressed: false,
        });

        const entries = await zip.getEntries();
        const compressedMetadata = entries
            .map((entry) => zip.entryMetadata(entry))
            .find((metadata) => metadata?.isEntryCompressed);
        expect(compressedMetadata?.entryLength).toBeGreaterThan(0);
    } finally {
        zip.freeDestroy();
    }
});

test("adds archive metadata to every EPUB reading-order resource", async () => {
    const publication = await PublicationParsePromise(epubPath);

    try {
        expect(publication.Spine?.length).toBeGreaterThan(0);
        for (const link of publication.Spine || []) {
            expect(link.Properties?.Archive?.EntryLength).toBeGreaterThanOrEqual(0);
            expect(typeof link.Properties?.Archive?.IsEntryCompressed).toBe("boolean");
        }
    } finally {
        publication.freeDestroy();
    }
});
