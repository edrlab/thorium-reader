// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as moment from "moment";
import { extname } from "path";
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

import { AccessibilityMetadata } from "@r2-shared-js/models/metadata-accessibility";
// import { AccessibilityCertification } from "@r2-shared-js/models/metadata-accessibility-certification";

// Logger
const debug = debug_("readium-desktop:main#w3c/audiobooks/converter");

interface IW3cLocalizableString {
    language?: string;
    value?: string;
    direction?: string;
}
type TW3cString = IW3cLocalizableString | string;
type TW3cLocalizableString = TW3cString[] | TW3cString;

function convertW3cLocalisableStringToReadiumManifestTitle(
    titleRaw: TW3cLocalizableString,
    defaultBcp47Language: string,
): string | IStringMap {

    if (titleRaw) {

        const titleObjArray = (
            Array.isArray(titleRaw) ? titleRaw : [titleRaw]
        ) as TW3cString[];

        const titleObj = titleObjArray
            .reduce(
                (pv, cv) =>
                    typeof cv === "object"
                        ? cv.language
                            ? { ...pv, [cv.language]: `${cv.value || ""}` }
                            : { ...pv, [defaultBcp47Language]: `${cv.value || ""}` }
                        : { ...pv, [defaultBcp47Language]: `${cv || ""}` },
                {} as IStringMap);

        const titleObjLength = Object.keys(titleObj).length;

        return titleObjLength > 1
            ? titleObj
            : titleObj[defaultBcp47Language];
    }
    return undefined;

}

interface IW3cEntities {
    type?: string[] | string;
    name?: TW3cLocalizableString;
    id?: string;
    url?: string;
    identifier?: string[] | string;
}

function convertW3cEntitiesToReadiumManifestContributors(
    entitiesRaw: IW3cEntities | IW3cEntities[] | string,
    defaultBcp47Language: string,
): Contributor[] {

    const entitiesArray = (Array.isArray(entitiesRaw) ? entitiesRaw : [entitiesRaw]) as Array<IW3cEntities | string>;
    const contributorArray = entitiesArray
        .filter((e) => e)
        .map<Contributor>((entity) => {
            const contributor = new Contributor();

            if (typeof entity === "object") {
                {
                    const value = convertW3cLocalisableStringToReadiumManifestTitle(entity.name, defaultBcp47Language);
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
    name?: TW3cLocalizableString;
    description?: TW3cLocalizableString;
    rel?: string | string[];
    integrity?: string;
    duration?: string;
    alternate?: IW3cLinkedResources | IW3cLinkedResources[];
}

function convertW3CpublicationLinksToReadiumManifestLink(
    lnRaw: IW3cLinkedResources | IW3cLinkedResources[] | string,
    defaultBcp47Language: string,
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
                        const titleStringOrMap = convertW3cLocalisableStringToReadiumManifestTitle(raw, defaultBcp47Language);
                        const title = typeof titleStringOrMap === "object"
                            ? titleStringOrMap[defaultBcp47Language]
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
                        const children = convertW3CpublicationLinksToReadiumManifestLink(alternate, defaultBcp47Language);
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

interface IW3cContext {
    direction?: string;
    language?: string;
}

export interface Iw3cPublicationManifest {
    "type"?: string | string[];
    "@context"?: string | string[] | Array<string | IW3cContext>;
    "conformsTo"?: string | string[];
    "id"?: string;
    "url"?: string;
    "name"?: TW3cLocalizableString;
    "dcterms:description"?: string;
    "dcterms:subject"?: any;
    "inLanguage"?: any;
    "datePublished"?: string;
    "dateModified"?: string;
    "duration"?: string;
    "links"?: string | IW3cLinkedResources | IW3cLinkedResources[];
    "resources"?: string | IW3cLinkedResources | IW3cLinkedResources[];
    "readingOrder"?: string | IW3cLinkedResources | IW3cLinkedResources[];
    "readBy"?: string | IW3cEntities | IW3cEntities[];
    "author"?: string | IW3cEntities | IW3cEntities[];
    "publisher"?: string | IW3cEntities | IW3cEntities[];
    "accessMode"?: string | string[];
    "accessModeSufficient"?: any | any[];
    "accessibilityFeature"?: string | string[];
    "accessibilityHazard"?: string | string[];
    "accessibilitySummary"?: TW3cLocalizableString;
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

    let defaultBcp47Language = BCP47_UNKNOWN_LANG;
    let defaultDirection; // undefined // auto mode
    // https://github.com/readium/webpub-manifest/tree/master/contexts/default#reading-progression-direction

    const publication = new R2Publication();

    {
        publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];

        const context = pop("@context");
        const contextArray = Array.isArray(context) ? context : [context];
        const validContext = contextArray.includes("https://www.w3.org/ns/pub-context");
        if (!validContext) {
            debug("context from W3C publication not valid !", context);
        }

        // https://github.com/SafetyCulture/bcp47/blob/e1afa0b61f932462f46c87195c746b0aade467ac/src/index.js#L1
        const BCP47ValidatorPattern = /^(?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))$|^((?:[a-z]{2,3}(?:(?:-[a-z]{3}){1,3})?)|[a-z]{4}|[a-z]{5,8})(?:-([a-z]{4}))?(?:-([a-z]{2}|\d{3}))?((?:-(?:[\da-z]{5,8}|\d[\da-z]{3}))*)?((?:-[\da-wy-z](?:-[\da-z]{2,8})+)*)?(-x(?:-[\da-z]{1,8})+)?$|^(x(?:-[\da-z]{1,8})+)$/i;
        const directionArray = ["ltr", "rtl", "ttb", "btt"];

        contextArray.forEach((value) => {

            if (typeof value === "object") {
                if (directionArray.includes(value.direction)) {
                    defaultDirection = value.direction;
                }
                if (value.language) {
                    if (BCP47ValidatorPattern.test(value.language)) {
                        defaultBcp47Language = value.language;
                    }
                }
            }
        });

        debug("default language =", defaultBcp47Language);
        debug("default direction =", defaultDirection);
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
        publication.Metadata.Title = convertW3cLocalisableStringToReadiumManifestTitle(title, defaultBcp47Language) || ""; // required
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
        if (defaultDirection) {
            publication.Metadata.Direction = defaultDirection;
        }
    }
    {
        const links = pop("links");
        const resources = pop("resources");
        const linksLinks = convertW3CpublicationLinksToReadiumManifestLink(links, defaultBcp47Language);
        const linksResources = convertW3CpublicationLinksToReadiumManifestLink(resources, defaultBcp47Language);
        if (linksLinks.length) {
            publication.Links = linksLinks;
        }
        if (linksResources.length) {
            publication.Resources = linksResources;
        }
    }
    {
        const readingOrder = pop("readingOrder");
        const links = convertW3CpublicationLinksToReadiumManifestLink(readingOrder, defaultBcp47Language);
        if (links.length) {
            publication.Spine = links;
            // https://github.com/readium/r2-shared-js/blob/develop/src/models/publication.ts#L63
        }
    }
    {
        const raw = pop("readBy");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw, defaultBcp47Language);
        if (contrib.length) {
            publication.Metadata.Narrator = contrib;
        }
    }
    {
        const raw = pop("author");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw, defaultBcp47Language);
        if (contrib.length) {
            publication.Metadata.Author = contrib;
        }
    }
    {
        const raw = pop("publisher");
        const contrib = convertW3cEntitiesToReadiumManifestContributors(raw, defaultBcp47Language);
        if (contrib) {
            publication.Metadata.Publisher = contrib;
        }
    }
    {
        const raw = pop("accessMode");
        const rawArray = (Array.isArray(raw) ? raw : [raw]);
        const rawArrayFiltered = rawArray.filter((l) => typeof l === "string");
        if (rawArrayFiltered.length) {
            // legacy
            publication.Metadata.AccessMode = rawArrayFiltered;
            // modern
            if (!publication.Metadata.Accessibility) {
                publication.Metadata.Accessibility = {} as AccessibilityMetadata;
            }
            publication.Metadata.Accessibility.AccessMode = rawArrayFiltered;
            // if (!publication.Metadata.Accessibility.Certification) {
            //     publication.Metadata.Accessibility.Certification = {} as AccessibilityCertification;
            // }
            // if (!publication.Metadata.Accessibility.Certification.Credential) {
            //     publication.Metadata.Accessibility.Certification.Credential = [];
            // }
            // publication.Metadata.Accessibility.Certification.Credential.push(val);
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
            // legacy
            publication.Metadata.AccessModeSufficient = rawArrayFormated;
            // modern
            if (!publication.Metadata.Accessibility) {
                publication.Metadata.Accessibility = {} as AccessibilityMetadata;
            }
            publication.Metadata.Accessibility.AccessModeSufficient = rawArrayFormated;
        }
    }
    {
        const raw = pop("accessibilityFeature");
        const rawArray = (Array.isArray(raw) ? raw : [raw]);
        const rawArrayFiltered = rawArray.filter((l) => typeof l === "string");
        if (rawArrayFiltered.length) {
            // legacy
            publication.Metadata.AccessibilityFeature = rawArrayFiltered;
            // modern
            if (!publication.Metadata.Accessibility) {
                publication.Metadata.Accessibility = {} as AccessibilityMetadata;
            }
            publication.Metadata.Accessibility.Feature = rawArrayFiltered;
        }
    }
    {
        const raw = pop("accessibilityHazard");
        const rawArray = (Array.isArray(raw) ? raw : [raw]);
        const rawArrayFiltered = rawArray.filter((l) => typeof l === "string");
        if (rawArrayFiltered.length) {
            // legacy
            publication.Metadata.AccessibilityHazard = rawArrayFiltered;
            // modern
            if (!publication.Metadata.Accessibility) {
                publication.Metadata.Accessibility = {} as AccessibilityMetadata;
            }
            publication.Metadata.Accessibility.Hazard = rawArrayFiltered;
        }
    }
    {
        const raw = pop("accessibilitySummary");
        const loc = convertW3cLocalisableStringToReadiumManifestTitle(raw, defaultBcp47Language);
        if (loc) {
            // legacy
            publication.Metadata.AccessibilitySummary = loc;
            // modern
            if (!publication.Metadata.Accessibility) {
                publication.Metadata.Accessibility = {} as AccessibilityMetadata;
            }
            publication.Metadata.Accessibility.Summary = loc;
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
            Array.isArray(publication.Links)
                ? publication.Links
                : []),
        ...(
            Array.isArray(publication.Spine)
                ? publication.Spine
                : []),
        ...(
            Array.isArray(publication.Resources)
                ? publication.Resources
                : []),
    ];

    return uniqueResources;
}
