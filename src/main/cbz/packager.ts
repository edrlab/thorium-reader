// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { DOMParser, type Document } from "@xmldom/xmldom";
import { imageSize } from "image-size";
import * as mime from "mime-types";

import { createTempDir } from "readium-desktop/main/fs/path";
import { createZip, TResourcesBUFFERCreateZip, TResourcesFSCreateZip } from "readium-desktop/main/zip/create";

import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";

interface IComicInfoPage {
    bookmark?: string;
    type?: string;
}

interface IComicInfo {
    creator?: string;
    description?: string;
    modifiedYear?: string;
    pages: Map<number, IComicInfoPage>;
    rightToLeft: boolean;
    title?: string;
}

interface ICbzImage {
    epubImagePath: string;
    epubPagePath: string;
    fsPath: string;
    height: number;
    mediaType: string;
    title: string;
    width: number;
}

const EPUB_ROOT = "EPUB";
const DEFAULT_PAGE_WIDTH = 1200;
const DEFAULT_PAGE_HEIGHT = 1600;

const xmlEscape = (value: string): string => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const xmlText = (document: Document, elementName: string): string | undefined => {
    const text = document.getElementsByTagName(elementName)[0]?.textContent?.trim();
    return text || undefined;
};

const parseComicInfo = (comicInfoXml: Buffer | undefined): IComicInfo => {
    const result: IComicInfo = {
        pages: new Map<number, IComicInfoPage>(),
        rightToLeft: false,
    };
    if (!comicInfoXml) {
        return result;
    }

    const document = new DOMParser().parseFromString(comicInfoXml.toString("utf8"), "application/xml");
    const title = xmlText(document, "Title");
    const series = xmlText(document, "Series");
    const number = xmlText(document, "Number");
    result.title = title || (series ? `${series}${number ? ` #${number}` : ""}` : undefined);
    result.creator = xmlText(document, "Writer");
    result.description = xmlText(document, "Summary");
    result.modifiedYear = xmlText(document, "Year");
    result.rightToLeft = xmlText(document, "Manga")?.toLowerCase() === "yesandrighttoleft";

    const pages = document.getElementsByTagName("Page");
    for (let i = 0; i < pages.length; i++) {
        const imageIndex = Number.parseInt(pages[i].getAttribute("Image") || "", 10);
        if (!Number.isFinite(imageIndex) || imageIndex < 0) {
            continue;
        }
        result.pages.set(imageIndex, {
            bookmark: pages[i].getAttribute("Bookmark") || undefined,
            type: pages[i].getAttribute("Type") || undefined,
        });
    }
    return result;
};

const getImageMediaType = (entryName: string): string | undefined => {
    const mediaType = mime.lookup(entryName);
    return mediaType && mediaType.startsWith("image/") ? mediaType : undefined;
};

const getImageExtension = (entryName: string, mediaType: string): string => {
    const fromMime = mime.extension(mediaType);
    if (fromMime) {
        return fromMime === "jpeg" ? "jpg" : fromMime;
    }
    const fromPath = path.extname(entryName).slice(1).replace(/[^a-z0-9]/gi, "").toLowerCase();
    return fromPath || "img";
};

const imageEntryCompare = (a: string, b: string): number =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });

const readZipEntry = async (zip: IZip, entryName: string): Promise<Buffer> => {
    const streamAndLength = await zip.entryStreamPromise(entryName);
    return streamToBufferPromise(streamAndLength.stream);
};

const pageXhtml = (image: ICbzImage, index: number): string => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="und" lang="und">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${image.width}, height=${image.height}" />
    <title>${xmlEscape(image.title)}</title>
    <link rel="stylesheet" type="text/css" href="../styles.css" />
</head>
<body>
    <img src="../images/${path.posix.basename(image.epubImagePath)}" alt="${xmlEscape(image.title || `Page ${index + 1}`)}" />
</body>
</html>
`;

const navXhtml = (title: string, images: ICbzImage[]): string => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="und" lang="und">
<head>
    <meta charset="utf-8" />
    <title>${xmlEscape(title)}</title>
</head>
<body>
    <nav epub:type="toc" id="toc">
        <h1>${xmlEscape(title)}</h1>
        <ol>
${images.map((image) => `            <li><a href="pages/${path.posix.basename(image.epubPagePath)}">${xmlEscape(image.title)}</a></li>`).join("\n")}
        </ol>
    </nav>
    <nav epub:type="page-list" id="page-list">
        <h2>Pages</h2>
        <ol>
${images.map((image, index) => `            <li><a href="pages/${path.posix.basename(image.epubPagePath)}">${index + 1}</a></li>`).join("\n")}
        </ol>
    </nav>
</body>
</html>
`;

const packageOpf = (title: string, comicInfo: IComicInfo, images: ICbzImage[]): string => {
    const identifier = `urn:uuid:${crypto.randomUUID()}`;
    const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const coverIndex = Math.max(0, images.findIndex((_image, index) =>
        comicInfo.pages.get(index)?.type?.toLowerCase() === "frontcover"));
    const direction = comicInfo.rightToLeft ? "rtl" : "ltr";
    const creator = comicInfo.creator ? `\n        <dc:creator>${xmlEscape(comicInfo.creator)}</dc:creator>` : "";
    const description = comicInfo.description ? `\n        <dc:description>${xmlEscape(comicInfo.description)}</dc:description>` : "";
    const date = comicInfo.modifiedYear ? `\n        <dc:date>${xmlEscape(comicInfo.modifiedYear)}</dc:date>` : "";

    const manifestImages = images.map((image, index) => {
        const coverProperty = index === coverIndex ? " properties=\"cover-image\"" : "";
        return `        <item id="image-${index + 1}" href="images/${path.posix.basename(image.epubImagePath)}" media-type="${xmlEscape(image.mediaType)}"${coverProperty} />`;
    }).join("\n");
    const manifestPages = images.map((image, index) =>
        `        <item id="page-${index + 1}" href="pages/${path.posix.basename(image.epubPagePath)}" media-type="application/xhtml+xml" />`).join("\n");
    const spine = images.map((_image, index) => {
        let pageSpread = "rendition:page-spread-center";
        if (index > 0) {
            const isLeft = comicInfo.rightToLeft ? index % 2 === 0 : index % 2 === 1;
            pageSpread = isLeft ? "page-spread-left" : "page-spread-right";
        }
        return `        <itemref idref="page-${index + 1}" properties="${pageSpread}" />`;
    }).join("\n");

    return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="pub-id">${identifier}</dc:identifier>
        <dc:title>${xmlEscape(title)}</dc:title>
        <dc:language>und</dc:language>${creator}${description}${date}
        <meta property="dcterms:modified">${modified}</meta>
        <meta property="rendition:layout">pre-paginated</meta>
        <meta property="rendition:orientation">auto</meta>
        <meta property="rendition:spread">auto</meta>
    </metadata>
    <manifest>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
        <item id="styles" href="styles.css" media-type="text/css" />
${manifestImages}
${manifestPages}
    </manifest>
    <spine page-progression-direction="${direction}">
${spine}
    </spine>
</package>
`;
};

const containerXml = `<?xml version="1.0" encoding="utf-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
    <rootfiles>
        <rootfile full-path="${EPUB_ROOT}/package.opf" media-type="application/oebps-package+xml" />
    </rootfiles>
</container>
`;

const stylesCss = `html, body {
    background: #000;
    height: 100%;
    margin: 0;
    overflow: hidden;
    padding: 0;
    width: 100%;
}

body {
    align-items: center;
    display: flex;
    justify-content: center;
}

img {
    display: block;
    height: 100%;
    object-fit: contain;
    width: 100%;
}
`;

export type TCbzPackagerResult = [epubPath: string, clean: () => void];

export async function cbzPackager(cbzPath: string): Promise<TCbzPackagerResult> {
    const outputDirectory = await createTempDir(crypto.randomUUID(), "cbz");
    const extractedImagesDirectory = path.join(outputDirectory, "images");
    await fs.promises.mkdir(extractedImagesDirectory, { recursive: true });

    const zip = await zipLoadPromise(cbzPath);
    let comicInfoBuffer: Buffer | undefined;
    const images: ICbzImage[] = [];
    try {
        const entries = await zip.getEntries();
        const comicInfoEntry = entries.find((entryName) =>
            path.posix.basename(entryName).toLowerCase() === "comicinfo.xml");
        if (comicInfoEntry) {
            comicInfoBuffer = await readZipEntry(zip, comicInfoEntry);
        }
        const comicInfo = parseComicInfo(comicInfoBuffer);
        const imageEntries = entries
            .filter((entryName) => !entryName.startsWith("__MACOSX/") && getImageMediaType(entryName))
            .sort(imageEntryCompare);

        for (let index = 0; index < imageEntries.length; index++) {
            const entryName = imageEntries[index];
            const mediaType = getImageMediaType(entryName);
            if (!mediaType) {
                continue;
            }
            const imageBuffer = await readZipEntry(zip, entryName);
            const extension = getImageExtension(entryName, mediaType);
            const baseName = `page-${String(index + 1).padStart(4, "0")}`;
            const fsPath = path.join(extractedImagesDirectory, `${baseName}.${extension}`);
            await fs.promises.writeFile(fsPath, imageBuffer);

            let width = DEFAULT_PAGE_WIDTH;
            let height = DEFAULT_PAGE_HEIGHT;
            try {
                const dimensions = imageSize(imageBuffer);
                width = dimensions.width || width;
                height = dimensions.height || height;
            } catch {
                // Keep a usable viewport for image types unsupported by image-size.
            }

            const pageInfo = comicInfo.pages.get(index);
            images.push({
                epubImagePath: `${EPUB_ROOT}/images/${baseName}.${extension}`,
                epubPagePath: `${EPUB_ROOT}/pages/${baseName}.xhtml`,
                fsPath,
                height,
                mediaType,
                title: pageInfo?.bookmark || `Page ${index + 1}`,
                width,
            });
        }
    } finally {
        zip.freeDestroy();
    }

    if (!images.length) {
        throw new Error("CBZ archive does not contain any supported images");
    }

    const comicInfo = parseComicInfo(comicInfoBuffer);
    const title = comicInfo.title || path.basename(cbzPath, path.extname(cbzPath));
    const resourcesFs: TResourcesFSCreateZip = images.map((image) => [image.fsPath, image.epubImagePath]);
    const resourcesBuffer: TResourcesBUFFERCreateZip = [
        [Buffer.from("application/epub+zip", "utf8"), "mimetype"],
        [Buffer.from(containerXml, "utf8"), "META-INF/container.xml"],
        [Buffer.from(packageOpf(title, comicInfo, images), "utf8"), `${EPUB_ROOT}/package.opf`],
        [Buffer.from(navXhtml(title, images), "utf8"), `${EPUB_ROOT}/nav.xhtml`],
        [Buffer.from(stylesCss, "utf8"), `${EPUB_ROOT}/styles.css`],
        ...images.map((image, index): [Buffer, string] =>
            [Buffer.from(pageXhtml(image, index), "utf8"), image.epubPagePath]),
    ];

    const epubPath = path.join(outputDirectory, "publication.epub");
    await createZip(epubPath, resourcesFs, resourcesBuffer, { buffersFirst: true });
    return [
        epubPath,
        () => fs.rmSync(outputDirectory, { force: true, recursive: true }),
    ];
}
