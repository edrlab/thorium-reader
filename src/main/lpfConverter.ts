// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { copy, ensureDir, move } from "fs-extra";
import { contentType } from "mime-types";
import * as moment from "moment";
import * as os from "os";
import { basename, extname, join } from "path";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { JsonMap } from "readium-desktop/typings/json";
import { iso8601DurationsToSeconds } from "readium-desktop/utils/iso8601";
import { v4 as uuidV4 } from "uuid";

import { TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Metadata } from "@r2-shared-js/models/metadata";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { Subject } from "@r2-shared-js/models/metadata-subject";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";

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

const getAndDeleteKeyInObject = <O = any>(obj: O) => (key: keyof typeof obj) => {
    const tmp = obj[key];
    delete obj[key];
    return tmp;
};

function w3cPublicationManifestToReadiumPublicationManifest(w3cManifest: JsonMap) {

    const pop = getAndDeleteKeyInObject(w3cManifest);

    const publication = new R2Publication();

    publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
    pop("@context");

    publication.Metadata = new Metadata();

    {
        const conformsTo = pop("conformsTo");
        if (conformsTo !== "https://www.w3/org/TR/audiobooks/") {
            debug(`not an audiobook W3C publication manifest. conformsTo=${w3cManifest.conformsTo}`);

            publication.Metadata.RDFType = "https://schema.org/CreativeWork";
        } else {
            publication.Metadata.RDFType = "https://schema.org/Audiobook";
        }
    }
    {
        publication.Metadata.Identifier = `${pop("id") || ""}` || `${pop("url") || ""}` || uuidV4();
    }
    {
        interface IW3cName {
            language?: string;
            value?: string;
        }

        const name = pop("name");
        if (typeof name === "object") {
            const nameObjArray = (Array.isArray(name) ? name : [name]) as IW3cName[];
            const nameObj = nameObjArray.reduce(
                (pv, cv: IW3cName) =>
                    cv.language ? { ...pv, [cv.language]: `${cv.value || ""}` } : pv,
                {} as IStringMap);
            publication.Metadata.Title = nameObj; // required
        } else {
            const nameStr = `${name || ""}`;
            publication.Metadata.Title = nameStr; // required
        }
    }
    {
        const value = `${pop("dcterms:description") || ""}`;
        if (value) {
            publication.Metadata.Description = value;
        }
    }
    {
        const value = pop("dcterms:subject");
        const valueArray = (Array.isArray(value) ? value : [value]) as any[];
        const subjectArray = valueArray.reduce<Subject[]>((pv, str) => {
            const sub = new Subject();

            sub.Name = `${str || ""}`;

            return sub.Name ? [...pv, sub] : pv;
        }, new Array<Subject>());
        if (subjectArray.length) {
            publication.Metadata.Subject = subjectArray;
        }
    }
    {
        const language = pop("inLanguage");
        const langArray = (Array.isArray(language) ? language : [language]);
        const langArrayFiltered = langArray.filter((l) => l && typeof l === "string") as string[];
        if (langArrayFiltered.length) {
            publication.Metadata.Language = langArrayFiltered;
        }
    }
    {
        const raw = `${pop("datePublished") || ""}`;
        const date = moment(raw);
        if (date.isValid()) {
            publication.Metadata.PublicationDate = date.toDate();
        }
    }
    {
        const raw = `${pop("dateModified") || ""}`;
        const date = moment(raw);
        if (date.isValid()) {
            publication.Metadata.Modified = date.toDate();
        }
    }
    {
        const iso8601 = `${pop("duration") || ""}`;
        const second = iso8601DurationsToSeconds(iso8601);
        if (second > 0) {
            publication.Metadata.Duration = second;
        }
    }
    {
        const resources = pop("resources") as JsonMap;
        const links = convertW3CpublicationLinksToReadiumManifestLink(resources);
        if (links.length) {
            publication.Links = links;
        }
    }
    {
        const readingOrder = pop("readingOrder") as JsonMap;
        const links = convertW3CpublicationLinksToReadiumManifestLink(readingOrder);
        if (links.length) {
            publication.Spine = links;
            // https://github.com/readium/r2-shared-js/blob/develop/src/models/publication.ts#L63
        }
    }
    {

        if (Object.keys(w3cManifest).length) {
            publication.Metadata.AdditionalJSON = w3cManifest;
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
                        link.TypeLink = contentType(ext) || ""; // typeLink required;
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
