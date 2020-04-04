// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { copy, ensureDir, move } from "fs-extra";
import * as moment from "moment";
import * as os from "os";
import { basename, extname, join } from "path";
import { TaJsonSerialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";
import { Metadata } from "r2-shared-js/dist/es6-es2015/src/models/metadata";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import { streamToBufferPromise } from "r2-utils-js/dist/es6-es2015/src/_utils/stream/BufferUtils";
import { IStreamAndLength } from "r2-utils-js/dist/es6-es2015/src/_utils/zip/zip";
import { injectBufferInZip } from "r2-utils-js/dist/es6-es2015/src/_utils/zip/zipInjector";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { JsonMap } from "readium-desktop/typings/json";
import { iso8601DurationsToSeconds } from "readium-desktop/utils/iso8601";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { v4 as uuidV4 } from "uuid";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";

// Logger
const debug = debug_("readium-desktop:main#lpfConverter");

async function copyAndRenameLpfFile(lpfPath: string): Promise<string> {

    const rand = Math.floor(Math.random() * 1000);
    const tmpPathName = `${_APP_NAME}-lpfconverter`;
    const tmpPath = os.tmpdir();
    const dirPath = join(tmpPath, tmpPathName);
    const lpfBasename = basename(lpfPath);
    const audiobookBasename = `${lpfBasename}.${rand}${acceptedExtensionObject.audiobook}`;
    const audiobookPath = join(dirPath, audiobookBasename);

    debug(`TMPPATH=${tmpPath} LPFPATH=${lpfPath} AUDIOBOOKPATH=${audiobookPath}`);

    // Ensures that the directory exists.
    await ensureDir(dirPath);

    // move the lpf file to a temporary directory
    await copy(lpfPath, audiobookPath, { overwrite: true });

    return audiobookPath;
}

async function openAndExtractPublicationFromLpf(lpfPath: string): Promise<NodeJS.ReadableStream> {

    const publicationEntryPath = "publication.json";
    const zip = await zipLoadPromise(lpfPath);

    if (!zip.hasEntries()) {
        return Promise.reject("LPF zip empty");
    }

    if (zip.hasEntry(publicationEntryPath)) {

        let entryStream: IStreamAndLength;
        try {
            entryStream = await zip.entryStreamPromise(publicationEntryPath);

        } catch (err) {
            debug(err);
            return Promise.reject(`Problem streaming LPF zip entry?! ${publicationEntryPath}`);
        }

        return entryStream.stream;

    } else {
        return Promise.reject("LPF zip 'publication.json' is missing");
    }
}

async function injectManifestToZip(audiobookPath: string, manifest: Buffer) {

    const audiobookPathTmp = `${audiobookPath}.zip`;
    const manifestEntryPath = "manifest.json";
    await new Promise((resolve, reject) => {
        injectBufferInZip(
            audiobookPath,
            audiobookPathTmp,
            manifest,
            manifestEntryPath,
            (e: any) => {
                debug("injectManifestToZip - injectBufferInZip ERROR!");
                debug(e);
                reject(e);
            },
            () => {
                resolve();
            });
    });

    await move(audiobookPathTmp, audiobookPath, { overwrite: true });
}

function w3cPublicationManifestToReadiumPublicationManifest(w3cManifest: JsonMap) {

    const publication = new R2Publication();

    publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
    publication.Metadata = new Metadata();

    if (w3cManifest.conformsTo !== "https://www.w3/org/TR/audiobooks/") {
        debug(`not an audiobook W3C publication manifest. conformsTo=${w3cManifest.conformsTo}`);

        publication.Metadata.RDFType = "https://schema.org/CreativeWork";
    } else {
        publication.Metadata.RDFType = "https://schema.org/Audiobook";
    }

    publication.Metadata.Identifier = `${w3cManifest.id || ""}` || `${w3cManifest.url || ""}` || uuidV4();

    {
        // Every metadata property found in the W3C manifest is copied as-is into the Readium manifest,
        // with the following exceptions:

        const metadataPropertyExceptionInW3cManifest = [
            "@context",
            "conformsTo",
            "name",
            "duration",
            "inLanguage",
            "datePublished",
            "dateModified",
            "resources",
            "readingOrder",
        ];

        const additionalKey = Object.keys(w3cManifest).filter(
            (key) =>
                !metadataPropertyExceptionInW3cManifest.includes(key),
        );
        if (additionalKey.length) {
           publication.Metadata.AdditionalJSON = {};
           additionalKey.forEach(
               (key) =>
                   publication.Metadata.AdditionalJSON[key] = w3cManifest[key],
           );
        }
    }
    {
        const name = w3cManifest.name;
        if (typeof name === "string") {
            publication.Metadata.Title = `${w3cManifest.name}`;

        } else if (typeof name === "object") {
            const nameArray = Array.isArray(name) ? name : [name];
            const titleObj = nameArray.reduce(
                (pv: any, cv: any) =>
                    cv.value && cv.language ? pv[`${cv.language}`] = `${cv.value}` : pv,
                {});
            if (ObjectKeys(titleObj).length) {
                publication.Metadata.Title = titleObj;
            }

        }
    }
    {
        const language = w3cManifest.inLanguage;
        if (typeof language === "string") {
            publication.Metadata.Language = [language];
        }
    }
    {
        const raw = `${w3cManifest.datePublished || ""}`;
        const date = moment(raw);
        if (date.isValid()) {
            publication.Metadata.PublicationDate = date.toDate();
        }
    }
    {
        const raw = `${w3cManifest.dateModified || ""}`;
        const date = moment(raw);
        if (date.isValid()) {
            publication.Metadata.Modified = date.toDate();
        }
    }
    {
        const iso8601 = `${w3cManifest.duration || ""}`;
        const second = iso8601DurationsToSeconds(iso8601);
        if (second > 0) {
            publication.Metadata.Duration = second;
        }
    }
    {
        const resources = w3cManifest.resources as JsonMap;
        const links = convertW3CpublicationLinksToReadiumManifestLink(resources);
        if (links.length) {
            publication.Links = links;
        }
    }
    {
        const readingOrder = w3cManifest.readingOrder as JsonMap;
        const links = convertW3CpublicationLinksToReadiumManifestLink(readingOrder);
        if (links.length) {
            publication.Spine = links;
            // https://github.com/readium/r2-shared-js/blob/develop/src/models/publication.ts#L63
        }
    }

    const publicationJson = TaJsonSerialize<R2Publication>(publication);

    return publicationJson;
}

function convertW3CpublicationLinksToReadiumManifestLink(ressources: JsonMap) {

    const linkArray = new Array<Link>();

    if (Array.isArray(ressources)) {

        ressources.forEach(
            (ressource: any) => {
                const link = new Link();

                {
                    const url = ressource.url;
                    if (typeof url === "string") {
                        link.Href = url;
                    }
                }
                {
                    const encodingFormat = ressource.encodingFormat;
                    if (typeof encodingFormat === "string") {
                        link.TypeLink = encodingFormat;

                    } else {
                        const ext = extname(link.Href);
                        switch (ext) {
                            case ".mp3":
                                link.TypeLink = "audio/mpeg";
                                break;
                            case ".wav":
                                link.TypeLink = "audio/wav";
                                break;
                            case ".opus":
                            case ".ogg":
                            case ".oga":
                                link.TypeLink = "audio/ogg";
                                break;
                            case ".m4a":
                                link.TypeLink = "audio/m4a";
                                break;
                            default:
                                link.TypeLink = ""; // typeLink required
                        }
                    }
                }
                {
                    const raw = ressource.name;
                    const name = Array.isArray(raw) ? raw[0] : raw;
                    if (typeof name === "string") {
                        link.Title = name;
                    }
                }
                {
                    const raw = ressource.rel;
                    const rawArray = Array.isArray(raw) ? raw : [raw];
                    const rel = rawArray.filter((_rel) => typeof _rel === "string");
                    if (rel.length) {
                        link.Rel = rel;
                    }
                }
                {
                    const iso8601 = `${ressource.duration || ""}`;
                    const second = iso8601DurationsToSeconds(iso8601);
                    if (second > 0) {
                        link.Duration = second;
                    }
                }
                {
                    const alternate = ressource.alternate;
                    const children = convertW3CpublicationLinksToReadiumManifestLink(alternate);
                    if (children.length) {
                        link.Children = children;
                    }
                }

                linkArray.push(link);
            });

    } else {
        debug("no resources found");
    }

    return linkArray;
}

export async function lpfToAudiobookConverter(lpfPath: string): Promise<string> {

    const lpfRenameInAudiobookPath = await copyAndRenameLpfFile(lpfPath);

    const stream = await openAndExtractPublicationFromLpf(lpfRenameInAudiobookPath);

    const buffer = await streamToBufferPromise(stream);
    const rawData = buffer.toString("utf8");
    const w3cManifest = JSON.parse(rawData) as JsonMap;

    const readiumManifest = w3cPublicationManifestToReadiumPublicationManifest(w3cManifest);

    const manifestBuffer = Buffer.from(JSON.stringify(readiumManifest, null, 4));
    await injectManifestToZip(lpfRenameInAudiobookPath, manifestBuffer);

    return lpfRenameInAudiobookPath;
}
