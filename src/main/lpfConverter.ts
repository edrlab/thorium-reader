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
import { BCP47_UNKNOWN_LANG } from "@r2-shared-js/parser/epub";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";
import { Contributor } from "r2-shared-js/dist/es6-es2015/src/models/metadata-contributor";
import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";

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

interface IW3cLocalizableString {
    language?: string;
    value?: string;
    direction?: string;
}

function convertW3cLocalisableStringToReadiumManifestTitle(
    titleRaw: IW3cLocalizableString[] | IW3cLocalizableString | string,
): string | IStringMap {

    const titleObjArray = (Array.isArray(titleRaw) ? titleRaw : [titleRaw]) as Array<IW3cLocalizableString | string>;
    const titleObj = titleObjArray.reduce<IStringMap>(
        (pv, cv) =>
            typeof cv === "object"
                ? cv.language
                    ? { ...pv, [cv.language]: `${cv.value || ""}` }
                    : { ...pv, [BCP47_UNKNOWN_LANG]: `${cv.value || ""}` }
                : { ...pv, [BCP47_UNKNOWN_LANG]: `${cv || ""}` },
        {});
    return Object.keys(titleObj).length > 1
        ? titleObj
        : titleObj[BCP47_UNKNOWN_LANG];

}

interface IW3cEntities {
    type?: string[] | string;
    name?: IW3cLocalizableString[] | IW3cLocalizableString | string;
    id?: string;
    url?: string;
    identifier?: string[] | string;
}

function convertW3cEntitiesToReadiumManifestContributors(
    entitiesRaw: IW3cEntities | IW3cEntities[] | string,
): Contributor[] {

    const entitiesArray = (Array.isArray(entitiesRaw) ? entitiesRaw : [entitiesRaw]) as Array<IW3cEntities | string>;
    const contributorArray = entitiesArray
        .filter((e) => e)
        .map<Contributor>((entity) => {
            const contributor = new Contributor();

            if (typeof entity === "object") {
                {
                    const value = convertW3cLocalisableStringToReadiumManifestTitle(entity.name);
                    contributor.Name = value; // required
                }
                {
                    const value = (Array.isArray(entity.type) ? entity.type : [entity.type]);
                    const valueFiltered = value.filter((v) => v && typeof v === "string");
                    contributor.Role = valueFiltered;

                }
                {
                    const value = `${entity.id || ""}` || `${entity.url || ""}` || `${entity.identifier || ""}`;
                    contributor.Identifier = value;
                }

            } else {
                contributor.Name = `${entity || ""}`;

            }

            return contributor;
        });

    return contributorArray;
}

interface IW3cLinkedResources {
    type?: string | string[];
    url?: string;
    encodingFormat?: string;
    name?: IW3cLocalizableString[] | IW3cLocalizableString | string;
    description?: IW3cLocalizableString[] | IW3cLocalizableString | string;
    rel?: string | string[];
    integrity?: string;
    duration?: string;
    alternate?: IW3cLinkedResources | IW3cLinkedResources[];
}

function convertW3CpublicationLinksToReadiumManifestLink(
    lnRaw: IW3cLinkedResources | IW3cLinkedResources[] | string,
): Link[] {

    const linkArray = (Array.isArray(lnRaw) ? lnRaw : [lnRaw]) as Array<IW3cLinkedResources | string>;
    const linkMap = linkArray
        .filter((l) => l)
        .map<Link>(
            (w3cLink) => {
                const rwpmLink = new Link();

                if (typeof w3cLink === "object") {

                    {
                        const url = w3cLink.url;
                        rwpmLink.Href = `${url}`;
                    }
                    {
                        const encodingformat = w3cLink.encodingFormat;
                        if (typeof encodingformat === "string") {
                            rwpmLink.TypeLink = encodingformat;

                        } else {
                            const ext = extname(rwpmLink.Href);
                            rwpmLink.TypeLink = findMimeTypeWithExtension(ext) || ""; // typeLink required;
                        }
                    }
                    {
                        const raw = w3cLink.name;
                        const titleStringOrMap = convertW3cLocalisableStringToReadiumManifestTitle(raw);
                        const title = typeof titleStringOrMap === "object"
                            ? titleStringOrMap[BCP47_UNKNOWN_LANG]
                            || titleStringOrMap[Object.keys(titleStringOrMap)[0]]
                            || ""
                            : titleStringOrMap;
                        if (title) {
                            rwpmLink.Title = title;
                        }
                    }
                    {
                        const raw = w3cLink.rel;
                        const rawArray = Array.isArray(raw) ? raw : [raw];
                        const rel = rawArray.filter((_rel) => typeof _rel === "string");
                        if (rel.length) {
                            rwpmLink.Rel = rel;
                        }
                    }
                    {
                        const iso8601 = `${w3cLink.duration || ""}`;
                        const second = iso8601DurationsToSeconds(iso8601);
                        if (second > 0) {
                            rwpmLink.Duration = second;
                        }
                    }
                    {
                        const alternate = w3cLink.alternate;
                        const children = convertW3CpublicationLinksToReadiumManifestLink(alternate);
                        if (children.length) {
                            rwpmLink.Alternate = children;
                        }
                    }
                } else {

                    rwpmLink.Href = `${w3cLink || ""}`;
                }

                return rwpmLink;
            });

    return linkMap;
}

function w3cPublicationManifestToReadiumPublicationManifest(w3cManifest: JsonMap) {

    const pop = ((obj: any) =>
        (key: keyof typeof obj) => {
            const tmp = obj[key];
            delete obj[key];
            return tmp;
        })(w3cManifest);

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
        const value = `${pop("id") || ""}` || `${pop("url") || ""}` || uuidV4();
        publication.Metadata.Identifier = value;
    }
    {
        const title = pop("name");
        publication.Metadata.Title = convertW3cLocalisableStringToReadiumManifestTitle(title) || ""; // required
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
            publication.Resources = links;
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
        const raw = pop("readBy");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw);
        publication.Metadata.Narrator = contrib;
    }
    {
        const raw = pop("author");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw);
        publication.Metadata.Author = contrib;
    }
    {
        const raw = pop("publisher");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw);
        publication.Metadata.Publisher = contrib;
    }
    {

        if (Object.keys(w3cManifest).length) {
            publication.Metadata.AdditionalJSON = w3cManifest;
        }
    }

    const publicationJson = TaJsonSerialize<R2Publication>(publication);

    return publicationJson;
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
