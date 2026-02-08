// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as mime from "mime-types";
import * as path from "path";
import slugify from "slugify";
import * as xmldom from "@xmldom/xmldom";

import { Metadata } from "@r2-shared-js/models/metadata";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
import { IStreamAndLength, IZip } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { removeUTF8BOM } from "@r2-utils-js/_utils/bom";

import { tryDecodeURI } from "../_utils/decodeURI";
import { zipHasEntry } from "../_utils/zipHasEntry";
import { ComicInfo } from "./comicrack/comicrack";
import { addCoverDimensions } from "./epub";

export function isCBZPublication(filePath: string): boolean {

    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);

    const cbz = /\.cbz$/i.test(ext);
    return cbz;
}

export async function CbzParsePromise(filePath: string): Promise<Publication> {

    let zip: IZip;
    try {
        zip = await zipLoadPromise(filePath);
    } catch (err) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    if (!zip.hasEntries()) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("CBZ zip empty");
    }

    const publication = new Publication();
    publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
    publication.Metadata = new Metadata();
    publication.Metadata.RDFType = "http://schema.org/ComicIssue";
    publication.Metadata.Identifier = filePathToTitle(filePath);

    publication.AddToInternal("type", "cbz");
    publication.AddToInternal("zip", zip);

    let comicInfoEntryName: string | undefined;

    let entries: string[] | undefined;
    try {
        entries = await zip.getEntries();
    } catch (err) {
        console.log(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("Problem getting CBZ zip entries");
    }
    if (entries) {
        for (const entryName of entries) {
            // console.log("++ZIP: entry");

            // console.log(entryName);

            const link = new Link();
            link.setHrefDecoded(entryName);

            const mediaType = mime.lookup(entryName);
            if (mediaType) {
                // console.log(mediaType);

                link.TypeLink = mediaType as string;
            } else {
                console.log("!!!!!! NO MEDIA TYPE?!");
            }

            if (link.TypeLink && link.TypeLink.startsWith("image/")) {
                if (!publication.Spine) {
                    publication.Spine = [];
                }
                publication.Spine.push(link);

            } else if (entryName.endsWith("ComicInfo.xml")) {
                comicInfoEntryName = entryName;
            }
        }
    }

    if (!publication.Metadata.Title) {
        publication.Metadata.Title = path.basename(filePath);
    }

    if (comicInfoEntryName) {
        try {
            const _b = await comicRackMetadata(zip, comicInfoEntryName, publication);
            console.log(_b);
        } catch (err) {
            console.log(err);
        }
    }

    return publication;
}

const filePathToTitle = (filePath: string): string => {
    const fileName = path.basename(filePath);
    return slugify(fileName, "_").replace(/[\.]/g, "_");
};

const comicRackMetadata = async (zip: IZip, entryName: string, publication: Publication) => {
    const entryNameDecoded = tryDecodeURI(entryName);
    if (!entryNameDecoded) {
        return;
    }

    const has = await zipHasEntry(zip, entryNameDecoded, entryName);
    if (!has) {
        console.log(`NOT IN ZIP: ${entryName} --- ${entryNameDecoded}`);
        const zipEntries = await zip.getEntries();
        for (const zipEntry of zipEntries) {
            if (zipEntry.startsWith("__MACOSX/")) {
                continue;
            }
            console.log(zipEntry);
        }
        return;
    }

    let comicZipStream_: IStreamAndLength;
    try {
        comicZipStream_ = await zip.entryStreamPromise(entryNameDecoded);
    } catch (err) {
        console.log(err);
        return;
    }
    const comicZipStream = comicZipStream_.stream;
    let comicZipData: Buffer;
    try {
        comicZipData = await streamToBufferPromise(comicZipStream);
    } catch (err) {
        console.log(err);
        return;
    }

    const comicXmlStr = removeUTF8BOM(comicZipData.toString("utf8"));
    const comicXmlDoc = new xmldom.DOMParser().parseFromString(comicXmlStr, "application/xml") as unknown as Document;

    const comicMeta = XML.deserialize<ComicInfo>(comicXmlDoc, ComicInfo);
    comicMeta.ZipPath = entryNameDecoded;

    if (!publication.Metadata) {
        publication.Metadata = new Metadata();
    }

    if (comicMeta.Writer) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Author) {
            publication.Metadata.Author = [];
        }
        publication.Metadata.Author.push(cont);
    }

    if (comicMeta.Penciller) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Penciler) {
            publication.Metadata.Penciler = [];
        }
        publication.Metadata.Penciler.push(cont);
    }

    if (comicMeta.Colorist) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Colorist) {
            publication.Metadata.Colorist = [];
        }
        publication.Metadata.Colorist.push(cont);
    }

    if (comicMeta.Inker) {
        const cont = new Contributor();
        cont.Name = comicMeta.Writer;

        if (!publication.Metadata.Inker) {
            publication.Metadata.Inker = [];
        }
        publication.Metadata.Inker.push(cont);
    }

    if (comicMeta.Title) {
        publication.Metadata.Title = comicMeta.Title;
    }

    if (!publication.Metadata.Title) {
        if (comicMeta.Series) {
            let title = comicMeta.Series;
            if (comicMeta.Number) {
                title = title + " - " + comicMeta.Number;
            }
            publication.Metadata.Title = title;
        }
    }

    if (comicMeta.Pages) {
        for (const p of comicMeta.Pages) {
            const l = new Link();
            if (p.Type === "FrontCover") {
                l.AddRel("cover");
                await addCoverDimensions(publication, l);
            }
            if (publication.Spine) {
                l.setHrefDecoded(publication.Spine[p.Image].Href);
            }
            if (p.ImageHeight) {
                l.Height = p.ImageHeight;
            }
            if (p.ImageWidth) {
                l.Width = p.ImageWidth;
            }
            if (p.Bookmark) {
                l.Title = p.Bookmark;
            }
            if (!publication.TOC) {
                publication.TOC = [];
            }
            publication.TOC.push(l);
        }
    }
};
