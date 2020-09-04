// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as moment from "moment";
import { extname } from "path";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { JsonMap } from "readium-desktop/typings/json";
import { iso8601DurationsToSeconds } from "readium-desktop/utils/iso8601";
import { findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";
import { v4 as uuidV4 } from "uuid";

import { Metadata } from "@r2-shared-js/models/metadata";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { Subject } from "@r2-shared-js/models/metadata-subject";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { BCP47_UNKNOWN_LANG } from "@r2-shared-js/parser/epub";
import { htmlTocToLinkArray } from "./toc";

// Logger
const debug = debug_("readium-desktop:main#w3c/audiobooks/mapper");

interface IW3cLocalizableString {
    language?: string;
    value?: string;
    direction?: string;
}

function convertW3cLocalisableStringToReadiumManifestTitle(
    titleRaw: IW3cLocalizableString[] | IW3cLocalizableString | string,
): string | IStringMap {

    if (titleRaw) {

        const titleObjArray = (
            Array.isArray(titleRaw) ? titleRaw : [titleRaw]
        ) as Array<IW3cLocalizableString | string>;
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
    return undefined;

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
                    contributor.Name = value || ""; // required
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

export interface IW3cLinkedResources {
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

//
// API
//

export interface Iw3cPublicationManifest {
    "type"?: string | string[];
    "@context"?: string | string[];
    "conformsTo"?: string | string[];
    "id"?: string;
    "url"?: string;
    "name"?: string | IW3cLocalizableString | IW3cLocalizableString[];
    "dcterms:description"?: string;
    "dcterms:subject"?: any;
    "inLanguage"?: any;
    "datePublished"?: string;
    "dateModified"?: string;
    "duration"?: string;
    "resources"?: string | IW3cLinkedResources | IW3cLinkedResources[];
    "readingOrder"?: string | IW3cLinkedResources | IW3cLinkedResources[];
    "readBy"?: string | IW3cEntities | IW3cEntities[];
    "author"?: string | IW3cEntities | IW3cEntities[];
    "publisher"?: string | IW3cEntities | IW3cEntities[];
    "accessMode"?: string | string[];
    "accessModeSufficient"?: any | any[];
    "accessibilityFeature"?: string | string[];
    "accessibilityHazard"?: string | string[];
    "accessibilitySummary"?: string | IW3cLocalizableString | IW3cLocalizableString[];
}

export async function w3cPublicationManifestToReadiumPublicationManifest(
    w3cManifest: Iw3cPublicationManifest,
    tocCallback: (uniqueRessources: Link[]) => HTMLElement | Promise<HTMLElement>,
): Promise<R2Publication> {

    const pop = ((obj: Iw3cPublicationManifest) =>
        <Key extends keyof typeof obj>(key: Key): Iw3cPublicationManifest[Key] => {
            const tmp = obj[key];
            delete obj[key];
            return tmp;
        })(w3cManifest);

    const publication = new R2Publication();

    {
        publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];

        const context = pop("@context");
        const contextArray = Array.isArray(context) ? context : [context];
        const validContext = contextArray.includes("https://www.w3.org/ns/pub-context");
        if (!validContext) {
            debug("context from W3C publication not valid !", context);
        }
    }

    publication.Metadata = new Metadata();

    {
        const conformsTo = pop("conformsTo");
        const conformsToArray = Array.isArray(conformsTo) ? conformsTo : [conformsTo];
        const validConformsTo = conformsToArray.includes("https://www.w3.org/TR/audiobooks/");

        const type = pop("type") || "";
        const typeArray = Array.isArray(type) ? type : [type];
        const validTypeUpper = typeArray
            .map((s) => typeof s === "string" && s.toUpperCase())
            .filter((s) => s);
        const validType = validTypeUpper.includes("AUDIO") || validTypeUpper.includes("AUDIOBOOK");

        if (validConformsTo || validType) {
            publication.Metadata.RDFType = "https://schema.org/Audiobook";
        } else {
            debug(`not an audiobook W3C publication manifest. conformsTo=${w3cManifest.conformsTo}`);

            publication.Metadata.RDFType = "https://schema.org/CreativeWork";
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
        const valueArray = (Array.isArray(value) ? value : [value]);
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
        const langArrayFiltered = langArray.filter((l) => typeof l === "string");
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
        const resources = pop("resources");
        const links = convertW3CpublicationLinksToReadiumManifestLink(resources);
        if (links.length) {
            publication.Resources = links;
        }
    }
    {
        const readingOrder = pop("readingOrder");
        const links = convertW3CpublicationLinksToReadiumManifestLink(readingOrder);
        if (links.length) {
            publication.Spine = links;
            // https://github.com/readium/r2-shared-js/blob/develop/src/models/publication.ts#L63
        }
    }
    {
        const raw = pop("readBy");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw);
        if (contrib.length) {
            publication.Metadata.Narrator = contrib;
        }
    }
    {
        const raw = pop("author");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw);
        if (contrib.length) {
            publication.Metadata.Author = contrib;
        }
    }
    {
        const raw = pop("publisher");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw);
        if (contrib) {
            publication.Metadata.Publisher = contrib;
        }
    }
    {
        const raw = pop("accessMode");
        const rawArray = (Array.isArray(raw) ? raw : [raw]);
        const rawArrayFiltered = rawArray.filter((l) => typeof l === "string");
        if (rawArrayFiltered.length) {
            publication.Metadata.AccessMode = rawArrayFiltered;
        }
    }
    {
        const raw = pop("accessModeSufficient");
        const rawArray = (Array.isArray(raw) ? raw : [raw]) as Array<{itemListElement: string[]}>;
        const rawArrayFormated = rawArray
            .reduce<string[][]>(
                (pv, cv) => [
                    ...pv,
                    Array.isArray(cv?.itemListElement)
                        ? cv.itemListElement.filter((f) => typeof f === "string")
                        : undefined,
                ], [])
            .filter((f) => f?.length);

        if (rawArrayFormated.length) {
            publication.Metadata.AccessModeSufficient = rawArrayFormated;
        }
    }
    {
        const raw = pop("accessibilityFeature");
        const rawArray = (Array.isArray(raw) ? raw : [raw]);
        const rawArrayFiltered = rawArray.filter((l) => typeof l === "string");
        if (rawArrayFiltered.length) {
            publication.Metadata.AccessibilityFeature = rawArrayFiltered;
        }
    }
    {
        const raw = pop("accessibilityHazard");
        const rawArray = (Array.isArray(raw) ? raw : [raw]);
        const rawArrayFiltered = rawArray.filter((l) => typeof l === "string");
        if (rawArrayFiltered.length) {
            publication.Metadata.AccessibilityHazard = rawArrayFiltered;
        }
    }
    {
        const raw = pop("accessibilitySummary");
        const loc = convertW3cLocalisableStringToReadiumManifestTitle(raw);
        if (loc) {
            publication.Metadata.AccessibilitySummary = loc;
        }
    }

    // TOC
    {
        const uniqueResources = getUniqueResourcesFromR2Publication(publication);

        if (tocCallback) {
            const tocElement = await Promise.resolve(tocCallback(uniqueResources));
            if (tocElement) {
                const toc = htmlTocToLinkArray(tocElement, uniqueResources);
                if (Array.isArray(toc) && toc.length) {
                    publication.TOC = toc;
                }
            }
        }
    }

    {
        // save all other properties
        if (Object.keys(w3cManifest).length) {
            publication.Metadata.AdditionalJSON = w3cManifest as JsonMap;
        }
    }

    return publication;
}

export function getUniqueResourcesFromR2Publication(publication: R2Publication): Link[] {

    const uniqueResources = [
        ...(
            Array.isArray(publication.Resources)
                ? publication.Resources
                : []),
        ...(
            Array.isArray(publication.Spine)
                ? publication.Spine
                : []),
    ];

    return uniqueResources;
}
