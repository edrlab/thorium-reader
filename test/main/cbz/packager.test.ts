// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import StreamZip from "node-stream-zip";

import { acceptedExtension, publicationFileExtensionsForDialog } from "readium-desktop/common/extension";
import { cbzPackager } from "readium-desktop/main/cbz/packager";
import { createZip } from "readium-desktop/main/zip/create";
import { extractFileFromZipToBuffer } from "readium-desktop/main/zip/extract";

import { EpubParsePromise } from "@r2-shared-js/parser/epub";

const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
);
const markedPng = (marker: string) => Buffer.concat([onePixelPng, Buffer.from(marker, "utf8")]);

describe("cbzPackager", () => {
    let inputDirectory: string;
    let cbzPath: string;
    let epubPath: string;
    let cleanEpub: () => void;

    beforeAll(async () => {
        inputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "thorium-cbz-packager-"));
        cbzPath = path.join(inputDirectory, "sample.cbz");
        const comicInfo = `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo>
    <Title>A &amp; B</Title>
    <Writer>Example Writer</Writer>
    <Summary>A comic packaged for Thorium.</Summary>
    <Year>2026</Year>
    <Manga>YesAndRightToLeft</Manga>
    <Pages>
        <Page Image="0" Type="FrontCover" Bookmark="Cover" />
        <Page Image="1" Bookmark="Second page" />
    </Pages>
</ComicInfo>`;
        await createZip(
            cbzPath,
            [],
            [
                [markedPng("ten"), "pages/10.png"],
                [markedPng("two"), "pages/2.png"],
                [markedPng("one"), "pages/1.png"],
                [Buffer.from(comicInfo, "utf8"), "ComicInfo.xml"],
            ],
        );
        [epubPath, cleanEpub] = await cbzPackager(cbzPath);
    });

    afterAll(() => {
        if (cleanEpub) {
            cleanEpub();
        }
        if (inputDirectory) {
            fs.rmSync(inputDirectory, { force: true, recursive: true });
        }
    });

    it("accepts CBZ files in imports and the file picker", () => {
        expect(acceptedExtension(".CBZ")).toBe(true);
        expect(publicationFileExtensionsForDialog).toContain("cbz");
    });

    it.each([false, true])("centers double pages and restarts pairing (RTL: %s)", async (rightToLeft) => {
        const inputPath = path.join(inputDirectory, `spreads-${rightToLeft}.cbz`);
        const landscapeSvg = Buffer.from(
            "<svg xmlns=\u0022http://www.w3.org/2000/svg\u0022 width=\u00222400\u0022 height=\u00221600\u0022><rect width=\u00222400\u0022 height=\u00221600\u0022 /></svg>",
        );
        await createZip(
            inputPath,
            [],
            [
                [onePixelPng, "0.png"],
                [onePixelPng, "1.png"],
                [onePixelPng, "2.png"],
                [landscapeSvg, "3.svg"],
                [onePixelPng, "4.png"],
                [onePixelPng, "5.png"],
                [landscapeSvg, "6.svg"],
                [onePixelPng, "7.png"],
                [
                    Buffer.from(`<ComicInfo>
                <Manga>${rightToLeft ? "YesAndRightToLeft" : "No"}</Manga>
                <Pages>
                    <Page Image="2" DoublePage="True" />
                    <Page Image="6" DoublePage="False" />
                </Pages>
            </ComicInfo>`),
                    "ComicInfo.xml",
                ],
            ],
        );
        const [convertedPath, clean] = await cbzPackager(inputPath);
        try {
            const publication = await EpubParsePromise(convertedPath);
            try {
                const firstSide = rightToLeft ? "right" : "left";
                const secondSide = rightToLeft ? "left" : "right";
                expect(publication.Spine?.map((link) => link.Properties?.Page)).toEqual([
                    "center",
                    firstSide,
                    "center",
                    "center",
                    firstSide,
                    secondSide,
                    firstSide,
                    secondSide,
                ]);
            } finally {
                publication.freeDestroy();
            }
            const widePage = await extractFileFromZipToBuffer(convertedPath, "EPUB/pages/page-0004.xhtml");
            expect(widePage?.toString("utf8")).toContain("content=\u0022width=2400, height=1600\u0022");
            expect(await extractFileFromZipToBuffer(convertedPath, "EPUB/images/page-0004.svg")).toEqual(landscapeSvg);
        } finally {
            clean();
        }
    });

    it("creates a spec-shaped EPUB archive", async () => {
        const mimetype = await extractFileFromZipToBuffer(epubPath, "mimetype");
        const container = await extractFileFromZipToBuffer(epubPath, "META-INF/container.xml");
        const zip = new StreamZip.async({ file: epubPath });
        try {
            const entries = await zip.entries();
            const firstEntry = Object.values(entries)[0];
            expect(firstEntry.name).toBe("mimetype");
            expect(firstEntry.method).toBe(0);
        } finally {
            await zip.close();
        }

        expect(mimetype?.toString("utf8")).toBe("application/epub+zip");
        expect(container?.toString("utf8")).toContain("EPUB/package.opf");
    });

    it("produces a right-to-left fixed-layout publication with naturally sorted pages", async () => {
        const publication = await EpubParsePromise(epubPath);
        try {
            expect(publication.Metadata.Title).toBe("A & B");
            expect(publication.Metadata.Direction).toBe("rtl");
            expect(publication.Metadata.Rendition.Layout).toBe("fixed");
            expect(publication.Spine?.map((link) => link.Href)).toEqual([
                "EPUB/pages/page-0001.xhtml",
                "EPUB/pages/page-0002.xhtml",
                "EPUB/pages/page-0003.xhtml",
            ]);
            expect(publication.Spine?.map((link) => link.Properties?.Page)).toEqual(["center", "right", "left"]);
            expect(publication.GetCover()?.Href).toBe("EPUB/images/page-0001.png");
        } finally {
            publication.freeDestroy();
        }

        const firstPage = await extractFileFromZipToBuffer(epubPath, "EPUB/pages/page-0001.xhtml");
        const secondPage = await extractFileFromZipToBuffer(epubPath, "EPUB/pages/page-0002.xhtml");
        const firstImage = await extractFileFromZipToBuffer(epubPath, "EPUB/images/page-0001.png");
        const secondImage = await extractFileFromZipToBuffer(epubPath, "EPUB/images/page-0002.png");
        const thirdImage = await extractFileFromZipToBuffer(epubPath, "EPUB/images/page-0003.png");
        expect(firstPage?.toString("utf8")).toContain("page-0001.png");
        expect(firstPage?.toString("utf8")).toContain("alt=\u0022Cover\u0022");
        expect(secondPage?.toString("utf8")).toContain("alt=\u0022Second page\u0022");
        expect(firstImage?.subarray(-3).toString("utf8")).toBe("one");
        expect(secondImage?.subarray(-3).toString("utf8")).toBe("two");
        expect(thirdImage?.subarray(-3).toString("utf8")).toBe("ten");
    });
});
