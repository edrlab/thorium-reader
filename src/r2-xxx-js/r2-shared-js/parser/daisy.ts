// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import * as path from "path";

import { Metadata } from "@r2-shared-js/models/metadata";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { isHTTP } from "@r2-utils-js/_utils/http/UrlUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";

import { zipHasEntry } from "../_utils/zipHasEntry";
import { convertNccToOpfAndNcx } from "./daisy-convert-ncc-to-opf-ncx";
import {
    addIdentifier, addLanguage, addMediaOverlaySMIL, addOtherMetadata, addTitle,
    fillPublicationDate, fillSpineAndResource, fillSubject, fillTOC, findContributorInMeta, getNcx,
    getOpf, lazyLoadMediaOverlays, setPublicationDirection, updateDurations,
} from "./epub-daisy-common";
import { Rootfile } from "./epub/container-rootfile";
import { NCX } from "./epub/ncx";
import { OPF } from "./epub/opf";
import { Manifest } from "./epub/opf-manifest";

const debug = debug_("r2:shared#parser/daisy");

export enum DaisyBookis {
    LocalExploded = "LocalExploded",
    LocalPacked = "LocalPacked",
    RemoteExploded = "RemoteExploded",
    RemotePacked = "RemotePacked",
}

export async function isDaisyPublication(urlOrPath: string): Promise<DaisyBookis | undefined> {
    let p = urlOrPath;
    const http = isHTTP(urlOrPath);
    if (http) {
        const url = new URL(urlOrPath);
        p = url.pathname;
        return undefined; // remote DAISY not supported
    } else if (/\.daisy[23]?$/i.test(path.extname(path.basename(p)))) {

        return DaisyBookis.LocalPacked;

    } else if (fs.existsSync(path.join(urlOrPath, "package.opf")) ||
        fs.existsSync(path.join(urlOrPath, "Book.opf")) ||
        fs.existsSync(path.join(urlOrPath, "ncc.html")) ||
        fs.existsSync(path.join(urlOrPath, "speechgen.opf"))
    ) {
        if (!fs.existsSync(path.join(urlOrPath, "META-INF", "container.xml"))) {

            return DaisyBookis.LocalExploded;
        }
    } else {
        let zip: IZip;
        try {
            zip = await zipLoadPromise(urlOrPath);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }

        if (!await zipHasEntry(zip, "META-INF/container.xml", undefined)) {

            // if (await zipHasEntry(zip, "package.opf", undefined) ||
            //     await zipHasEntry(zip, "Book.opf", undefined) ||
            //     await zipHasEntry(zip, "speechgen.opf", undefined)) {
            //     return DaisyBookis.LocalPacked;
            // }

            const entries = await zip.getEntries();
            const opfZipEntryPath = entries.find((entry) => {
                // regexp fails?!
                // return /[^/]+\.opf$/i.test(entry);
                // && entry.indexOf("/") < 0 && entry.indexOf("\\") < 0;
                return /ncc\.html$/i.test(entry) || /\.opf$/i.test(entry);
            });
            if (!opfZipEntryPath) {
                return undefined;
            }

            // TODO: check for <dc:Format>ANSI/NISO Z39.86-2005</dc:Format> ?
            return DaisyBookis.LocalPacked;
        }
    }
    return undefined;
}

export async function DaisyParsePromise(filePath: string): Promise<Publication> {

    // const isDaisy = await isDaisyPublication(filePath);

    let zip: IZip;
    try {
        zip = await zipLoadPromise(filePath);
    } catch (err) {
        debug(err);
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject(err);
    }

    if (!zip.hasEntries()) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("Daisy zip empty");
    }

    const publication = new Publication();
    publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
    publication.Metadata = new Metadata();
    publication.Metadata.RDFType = "http://schema.org/Book";
    // publication.Metadata.Modified = moment(Date.now()).toDate();

    publication.AddToInternal("filename", path.basename(filePath));

    publication.AddToInternal("type", "daisy");
    publication.AddToInternal("zip", zip);

    // note: does not work in RemoteExploded
    const entries = await zip.getEntries();

    // const [valid, message] = isFileValid(entries);
    // if (!valid) {
    //     return Promise.reject(message || "File validation failed.");
    // }

    // generic "text/xml" content type
    // manifest/item@media-type
    let opfZipEntryPath = entries.find((entry) => {
        // regexp fails?!
        // return /[^/]+\.opf$/i.test(entry);
        // && entry.indexOf("/") < 0 && entry.indexOf("\\") < 0;
        return /\.opf$/i.test(entry);
    });
    let daisy2NccZipEntryPath: string | undefined;
    if (!opfZipEntryPath) {
        daisy2NccZipEntryPath = entries.find((entry) => {
            return /ncc\.html$/i.test(entry);
        });
        opfZipEntryPath = daisy2NccZipEntryPath;
    }

    if (!opfZipEntryPath) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("DAISY3 OPF package XML file or DAISY2 NCC cannot be found.");
    }

    const rootfilePathDecoded = opfZipEntryPath; // || "package.opf";
    if (!rootfilePathDecoded) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject("?!rootfile.PathDecoded");
    }

    let opf: OPF | undefined;
    let ncx: NCX | undefined;
    if (daisy2NccZipEntryPath) { // same as opfZipEntryPath
        [opf, ncx] = await convertNccToOpfAndNcx(zip, rootfilePathDecoded, opfZipEntryPath);
    } else {
        opf = await getOpf(zip, rootfilePathDecoded, opfZipEntryPath);
        if (opf.Manifest) {
            let ncxManItem = opf.Manifest.find((manifestItem) => {
                return manifestItem.MediaType === "application/x-dtbncx+xml";
            });
            if (!ncxManItem) {
                ncxManItem = opf.Manifest.find((manifestItem) => {
                    return manifestItem.MediaType === "text/xml" &&
                        manifestItem.Href && /\.ncx$/i.test(manifestItem.Href);
                });
            }
            if (ncxManItem) {
                ncx = await getNcx(ncxManItem, opf, zip);
            }
        }
    }

    addLanguage(publication, opf);

    addTitle(publication, undefined, opf);

    addIdentifier(publication, opf);

    addOtherMetadata(publication, undefined, opf);

    setPublicationDirection(publication, opf);

    findContributorInMeta(publication, undefined, opf);

    await fillSpineAndResource(publication, undefined, opf, zip, addLinkData);

    fillTOC(publication, opf, ncx);

    fillSubject(publication, opf);

    fillPublicationDate(publication, undefined, opf);

    return publication;
}

const addLinkData = async (
    publication: Publication, _rootfile: Rootfile | undefined,
    opf: OPF, zip: IZip, linkItem: Link, item: Manifest) => {

    if (publication.Metadata?.AdditionalJSON) {

        // TODO: textPartAudio / audioPartText?? audioOnly??
        // https://www.daisy.org/z3986/specifications/Z39-86-2002.html#Type
        // https://www.daisy.org/z3986/specifications/daisy_202.html

        const isFullTextAudio =
            // dtb:multimediaContent ==> audio,text
            publication.Metadata.AdditionalJSON["dtb:multimediaType"] === "audioFullText" ||
            publication.Metadata.AdditionalJSON["ncc:multimediaType"] === "audioFullText" || (
                !publication.Metadata.AdditionalJSON["dtb:multimediaType"] &&
                !publication.Metadata.AdditionalJSON["ncc:multimediaType"]
            );

        const isAudioOnly =
            // dtb:multimediaContent ==> audio
            publication.Metadata.AdditionalJSON["dtb:multimediaType"] === "audioNCX" ||
            publication.Metadata.AdditionalJSON["ncc:multimediaType"] === "audioNcc";

        const isTextOnly =
            // dtb:multimediaContent ==> text
            publication.Metadata.AdditionalJSON["dtb:multimediaType"] === "textNCX" ||
            publication.Metadata.AdditionalJSON["ncc:multimediaType"] === "textNcc";

        if (isFullTextAudio || isTextOnly || isAudioOnly) {
            await addMediaOverlaySMIL(linkItem, item, opf, zip);

            if (linkItem.MediaOverlays && !linkItem.MediaOverlays.initialized) {

                // debug(
                //     global.JSON.stringify(TaJsonSerialize(publication), null, 4),
                //     global.JSON.stringify(linkItem, null, 4));

                // if (process.env) {
                //     throw new Error("BREAK");
                // }

                // mo.initialized true/false is automatically handled
                await lazyLoadMediaOverlays(publication, linkItem.MediaOverlays);

                if (isFullTextAudio || isAudioOnly) {
                    updateDurations(linkItem.MediaOverlays.duration, linkItem);
                }
            }
        }
    }
};
