// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import * as path from "path";
import { ok } from "readium-desktop/common/utils/assert";
import { httpGet } from "readium-desktop/main/network/http";
import {
    getUniqueResourcesFromR2Publication, w3cPublicationManifestToReadiumPublicationManifest,
} from "readium-desktop/main/w3c/audiobooks/converter";
import {
    findManifestFromHtmlEntryAndReturnBuffer,
} from "readium-desktop/main/w3c/audiobooks/entry";
import { findHtmlTocInRessources } from "readium-desktop/main/w3c/audiobooks/toc";
import { createWebpubZip, TResourcesFSCreateZip } from "readium-desktop/main/zip/create";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped } from "typed-redux-saga/macro";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { downloader } from "../../../downloader";
import { manifestContext } from "./context";

// Logger
const filename_ = "readium-desktop:main#saga/api/publication/packager/packageLink";
const debug = debug_(filename_);

const fetcher = (baseUrl: string) => async (href: string) => {

    debug("fetcher", href);
    // DEPRECATED API (watch for the inverse function parameter order!):
    // url.resolve(baseUrl, href)
    href = new URL(href, baseUrl).toString();

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

    const uResources = getUniqueResourcesFromR2Publication(r2Publication);
    debug(uResources);

    const resourcesHref = [...new Set(linksToArray(uResources))];
    debug(resourcesHref);

    const resourcesType = resourcesHref.map((v) => {
        // tslint:disable-next-line
        try { new URL(v); return false; } catch {}
        return true;
    });
    debug(resourcesType);

    const resourcesHrefResolved = tryCatchSync(() => {
        const baseUrlURL = new URL(baseUrl);

        if (baseUrlURL.protocol === "file:") {
            // new URL('file://C:/test/here')).pathname
            // /C:/test/here
            // WARNING: see code comment about isWindowsFilesystemPathRooted below!
            const baseUrlLocal = baseUrl.slice("file://".length);

            return resourcesHref.map((l) => path.join(baseUrlLocal, l));
        }

        // DEPRECATED API (watch for the inverse function parameter order!):
        // url.resolve(baseUrl, l)
        return resourcesHref
            .map((l) => tryCatchSync(() => new URL(l, baseUrl).toString(), filename_))
            .filter((v) => !!v);

    }, filename_);
    debug(resourcesHrefResolved);

    const pathArrayFromDownloader = baseUrl.startsWith("file://")
        ? resourcesHrefResolved
        : yield* callTyped(downloader, resourcesHrefResolved, title);
    debug(pathArrayFromDownloader);

    const pathArray = pathArrayFromDownloader.map<[string, boolean]>((v, i) => [v, resourcesType[i]]);
    debug(pathArray);

    const resourcesHrefMap = pathArray.map<TResource>(
        ([fsPath, isResourcesType], idx) => {

            // fsPath can be undefined
            if (!fsPath) {
                return undefined;
            }

            // The following code block is not needed,
            // as resourcesHrefResolved guarantees absolute filenames,
            // removing file://
            // and bypassing the URL(baseHref, href).toString() normalization.
            // Reminder about URL(baseHref, href).toString():
            // if the base URL is file://C:/etc. on Windows,
            // the URL API adds a slash prefix: file:///C:/etc. to match Linux / MacOS absolute file path root syntax
            //
            // const isWindowsFilesystemPathRooted = path.sep === "\\" && /^\/[a-zA-Z]:\//.test(fsPath);
            // const fsPath_ = isWindowsFilesystemPathRooted ?
            //     fsPath.substr(1).replace(/\//g, "\\") :
            //     fsPath;
            // debug(isWindowsFilesystemPathRooted, fsPath);

            let zipPath: string;
            if (isResourcesType) {
                zipPath = resourcesHref[idx];

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
    debug(resourcesHrefMap);

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

function* BufferManifestToR2Publication(r2PublicationBuffer: Buffer, href: string): SagaGenerator<R2Publication | undefined> {

    let r2Publication: R2Publication;

    const fetch = fetcher(href);

    let r2PublicationJson: any;
    try {

        const r2PublicationStr = r2PublicationBuffer.toString("utf-8");
        r2PublicationJson = JSON.parse(r2PublicationStr);

    } catch (e) {

        debug("error to parse manifest", e, r2PublicationBuffer);
        return undefined;
    }

    const [isR2, isW3] = manifestContext(r2PublicationJson);

    if (isW3) {
        debug("w3cManifest found");

        r2Publication = yield* callTyped(
            w3cPublicationManifestToReadiumPublicationManifest,
            r2PublicationJson,
            async (resources: Link[]) => findHtmlTocInRessources(resources, fetch),
        );

    } else if (isR2) {
        debug("readium manifest found");

        r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);
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
    baseUrl: string, // 'file://' for local resources
    manifest: Buffer,
    manifestPath?: string,
) {
    const r2Publication = yield* callTyped(BufferManifestToR2Publication, manifest, baseUrl);
    if (!r2Publication) {
        throw new Error("r2Publication parsing failed");
    }

    debug("ready to package the r2Publication");
    debug(r2Publication);

    // DEPRECATED API (watch for the inverse function parameter order!):
    // url.resolve(baseUrl, manifestPath)
    const manifestUrlAbsolutized = manifestPath ?
        tryCatchSync(() => new URL(manifestPath, baseUrl).toString(), filename_) :
        baseUrl;
    debug("manifestUrl", manifestUrlAbsolutized, manifestPath, baseUrl);

    const resourcesHrefMap = yield* callTyped(
        downloadResources,
        r2Publication,
        baseUrl,
        manifestUrlAbsolutized,
    );

    const r2PublicationUpdated = updateManifest(r2Publication, resourcesHrefMap);
    debug(r2PublicationUpdated);

    const manifestSerialize = TaJsonSerialize(r2PublicationUpdated);
    const manifestString = JSON.stringify(manifestSerialize);
    const manifestBuffer = Buffer.from(manifestString);

    // create the .webpub zip package
    const resourcesCreateZip: TResourcesFSCreateZip = resourcesHrefMap.map(([fsPath, , zipPath]) => [fsPath, zipPath]);
    debug(resourcesCreateZip);

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
