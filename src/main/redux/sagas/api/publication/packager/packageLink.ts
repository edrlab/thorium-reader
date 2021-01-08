// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import * as crypto from "crypto";
import * as debug_ from "debug";
import * as path from "path";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { httpGet } from "readium-desktop/main/http";
import {
    w3cPublicationManifestToReadiumPublicationManifest,
} from "readium-desktop/main/w3c/audiobooks/converter";
import {
    findManifestFromHtmlEntryAndReturnBuffer,
} from "readium-desktop/main/w3c/audiobooks/entry";
import { findHtmlTocInRessources } from "readium-desktop/main/w3c/audiobooks/toc";
import { createWebpubZip, TResourcesFSCreateZip } from "readium-desktop/main/zip/create";
import { SagaGenerator } from "typed-redux-saga";
import * as url from "url";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { downloader } from "../../../downloader";
import { manifestContext } from "./context";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/packager/packageLink");

const fetcher = (baseUrl: string) => async (href: string) => {

    debug("fetcher", href);
    href = url.resolve(baseUrl, decodeURIComponent(href));

    const res = await httpGet(href);

    try {
        ok(res.isSuccess, res.statusMessage);

        return await res.response.buffer();

    } catch (e) {
        debug("error to fetch", e);
    }
    return undefined;
};

const copyAndSetHref = (lns: Link[], hrefMapToFind: TResources) =>
    lns.map(
        (ln) => {

            const href = ln.Href;
            const found = hrefMapToFind.find(([, searchValue]) => searchValue === href);
            if (found) {
                const [, , replaceValue] = found;
                ln.Href = replaceValue;
            }

            if (Array.isArray(ln.Children) && ln.Children.length) {
                ln.Children = copyAndSetHref(ln.Children, hrefMapToFind);
            }

            return ln;
        });

const linksToArray = (lns: Link[]): string[] =>
    lns.reduce(
        (pv, cv) =>
            cv.Href
                ? [
                    ...pv,
                    cv.Href,
                    ...(
                        Array.isArray(cv.Children) && cv.Children.length
                            ? linksToArray(cv.Children)
                            : []
                    ),
                ]
                : pv,
        new Array<string>());

type TResource = [fsPath: string, href: string, zipPath: string];
type TResources = TResource[];
function* downloadResources(
    r2Publication: R2Publication,
    title: string,
    baseUrl: string,
): SagaGenerator<TResources> {
    const readingpluslink = [
        ...(
            Array.isArray(r2Publication.Links)
                ? r2Publication.Links
                : []),
        ...(
            Array.isArray(r2Publication.Spine)
                ? r2Publication.Spine
                : []),
    ];

    const resources = [
        ...(
            Array.isArray(r2Publication.Resources)
                ? r2Publication.Resources
                : []),
    ];

    const resourcesHrefReadingPlusLink = [...new Set(linksToArray(readingpluslink))];
    const resourcesHrefResources = [...new Set(linksToArray(resources))];

    const resourcesHref = [...resourcesHrefReadingPlusLink, ...resourcesHrefResources];
    const resourcesType = [...resourcesHrefReadingPlusLink.map(() => false), ...resourcesHrefResources.map(() => true)];

    const getPathArray = function*(): SagaGenerator<[Array<[string, boolean]>, string[]]> {

        if (baseUrl.startsWith("file://")) {
            baseUrl = baseUrl.slice("file://".length);
            const a = resourcesHref.map((l) => url.resolve(baseUrl, decodeURIComponent(l)));
            const b = a.map<[string, boolean]>((v, i) => [v, resourcesType[i]]);
            return [b, a];
        } else {
            const a = resourcesHref.map((l) => url.resolve(baseUrl, decodeURIComponent(l)));
            const b = yield* callTyped(downloader, a, title);
            const c = b.map<[string, boolean]>((v, i) => [v, resourcesType[i]]);
            return [c, a];
        }
    };

    const [pathArray, resourcesHrefResolved] = yield* callTyped(getPathArray);

    const resourcesHrefMap = pathArray.map<TResource>(
        ([fsPath, isResourcesType], idx) => {

            // fsPath can be undefined
            if (!fsPath) {
                return undefined;
            }

            let zipPath: string;
            if (isResourcesType) {
                zipPath = path.normalize(resourcesHref[idx]);

                // specific fixes for exploded epub format
                // zipPath = zipPath.startsWith("OEBPS/")
                //     ? zipPath.slice(6)
                //     : zipPath.startsWith("/OEBPS/")
                //         ? zipPath.slice(7)
                //         : zipPath;
            } else {
                const hash = crypto.createHash("sha1").update(resourcesHref[idx]).digest("hex");
                zipPath = hash + "/" + path.basename(resourcesHrefResolved[idx]);
            }
            return [
                fsPath,
                resourcesHref[idx],
                zipPath,
            ];

        },
    ).filter((v) => !!v);

    return resourcesHrefMap;
}

function updateManifest(
    r2Publication: R2Publication,
    resourcesHrefMap: TResources,
) {
    {
        const readingOrders = r2Publication.Spine;
        if (Array.isArray(readingOrders)) {
            r2Publication.Spine = copyAndSetHref(readingOrders, resourcesHrefMap);
        }
    }

    {
        const links = r2Publication.Links;
        if (Array.isArray(links)) {
            r2Publication.Links = copyAndSetHref(links, resourcesHrefMap);
        }
    }

    {
        const resources = r2Publication.Resources;
        if (Array.isArray(resources)) {
            r2Publication.Resources = copyAndSetHref(resources, resourcesHrefMap);
        }
    }

    return r2Publication;

}

function* BufferManifestToR2Publication(manifest: Buffer, href: string): SagaGenerator<R2Publication | undefined> {

    let r2Publication: R2Publication;

    const fetch = fetcher(href);

    let manifestJson: any;
    try {

        const manifestStr = manifest.toString();
        manifestJson = JSON.parse(manifestStr);

    } catch (e) {

        debug("error to parse manifest", e, manifest);
        return undefined;
    }

    const [isR2, isW3] = manifestContext(manifestJson);

    if (isW3) {
        debug("w3cManifest found");

        r2Publication = yield* callTyped(
            w3cPublicationManifestToReadiumPublicationManifest,
            manifestJson,
            async (resources) => findHtmlTocInRessources(resources, fetch),
        );

    } else if (isR2) {
        debug("readium manifest found");

        r2Publication = TaJsonDeserialize(manifestJson, R2Publication);
    }

    return r2Publication;
}

export function* packageFromLink(
    href: string,
    isHtml: boolean,
): SagaGenerator<string | undefined> {

    const [manifest, manifestUrl] = yield* callTyped(packageGetManifestBuffer, href, isHtml);
    if (!manifest) {
        throw new Error("manifest not found from content link " + href);
    }

    return yield* callTyped(packageFromManifestBuffer, href, manifest, manifestUrl);
}

export function* packageFromManifestBuffer(
    href: string, // 'file://' for local resources
    manifest: Buffer,
    manifestUrl?: string,
) {

    const r2Publication = yield* callTyped(BufferManifestToR2Publication, manifest, href);
    if (!r2Publication) {
        throw new Error("r2Publication parsing failed");
    }

    debug("ready to package the r2Publication");
    debug(r2Publication);

    const manifestUrlAbsolutized = manifestUrl ? url.resolve(href, manifestUrl) : undefined;
    debug("manifestUrl", manifestUrlAbsolutized);

    const resourcesHrefMap = yield* callTyped(
        downloadResources,
        r2Publication,
        href,
        manifestUrlAbsolutized || href,
    );

    const r2PublicationUpdated = updateManifest(r2Publication, resourcesHrefMap);

    const manifestSerialize = TaJsonSerialize(r2PublicationUpdated);
    const manifestString = JSON.stringify(manifestSerialize);
    const manifestBuffer = Buffer.from(manifestString);

    // create the .webpub zip package
    const resourcesCreateZip: TResourcesFSCreateZip = resourcesHrefMap.map(([fsPath, , zipPath]) => [fsPath, zipPath]);
    const webpubPath = yield* callTyped(createWebpubZip, manifestBuffer, resourcesCreateZip, [], "packager");

    return webpubPath;
}

export function* packageGetManifestBuffer(
    href: string,
    isHtml: boolean,
): SagaGenerator<[Buffer, string]> {

    let manifestBuffer: Buffer;
    let manifestUrl: string;

    const fetch = fetcher(href);

    const data = yield* callTyped(httpGet, href);
    const { response, isFailure } = data;

    const rawData = yield* callTyped(() => response?.text());
    if (isFailure) {
        throw new Error("fetch error [" + href + "](" + response?.status + " " + response?.statusText + " " + rawData + "]");
        // we can add a toast notification here like the downloader
    }

    if (rawData) {
        if (isHtml) {

            const htmlBuffer = Buffer.from(rawData);
            [manifestBuffer, manifestUrl] = yield* callTyped(
                findManifestFromHtmlEntryAndReturnBuffer,
                htmlBuffer,
                fetch,
            );

        } else {
            manifestBuffer = Buffer.from(rawData);
        }
    }

    return [manifestBuffer, manifestUrl];
}
