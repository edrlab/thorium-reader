import { describe, expect, it } from "@jest/globals";

import { pdfManifest } from "readium-desktop/main/pdf/manifest";

describe("pdfManifest", () => {
    it("uses OPDS metadata when the PDF has no embedded title or author", async () => {
        const manifest = await pdfManifest(
            "file.pdf",
            { numberOfPages: 42 },
            {
                title: "Reimagining Nabokov: Pedagogies for the 21st Century",
                authors: ["Sara Karpukhin", { en: "José Vergara", fr: "José Vergara" }],
            },
        );

        expect(manifest.Metadata.Title).toBe("Reimagining Nabokov: Pedagogies for the 21st Century");
        expect(manifest.Metadata.Author?.map((author) => author.Name)).toEqual([
            "Sara Karpukhin",
            { en: "José Vergara", fr: "José Vergara" },
        ]);
        expect(manifest.Metadata.NumberOfPages).toBe(42);
    });

    it("keeps embedded PDF metadata ahead of OPDS fallback metadata", async () => {
        const manifest = await pdfManifest(
            "file.pdf",
            {
                Author: "Embedded author",
                Title: "Embedded title",
                numberOfPages: 10,
            },
            {
                authors: ["OPDS author"],
                title: "OPDS title",
            },
        );

        expect(manifest.Metadata.Title).toBe("Embedded title");
        expect(manifest.Metadata.Author?.map((author) => author.Name)).toEqual(["Embedded author"]);
    });

    it("retains the filename fallback for PDFs imported outside OPDS", async () => {
        const manifest = await pdfManifest("local-document.pdf", undefined);

        expect(manifest.Metadata.Title).toBe("local-document");
        expect(manifest.Metadata.Author).toBeUndefined();
    });
});
