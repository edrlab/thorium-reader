// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import * as debug_ from "debug";
import { createWriteStream } from "fs";
import { nanoid } from "nanoid";
import * as path from "path";
import { TaJsonDeserialize, TaJsonSerialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { httpGet } from "readium-desktop/main/http";
import {
    getUniqueResourcesFromR2Publication, w3cPublicationManifestToReadiumPublicationManifest,
} from "readium-desktop/main/w3c/audiobooks/converter";
import {
    findManifestFromHtmlEntryAndReturnBuffer,
} from "readium-desktop/main/w3c/audiobooks/entry";
import { findHtmlTocInRessources } from "readium-desktop/main/w3c/audiobooks/toc";
import { SagaGenerator } from "typed-redux-saga";
import * as url from "url";
import { ZipFile } from "yazl";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { downloadCreatePathDir, downloader } from "../../../downloader";
import { manifestContext } from "./context";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/packager/packageLink");

type TPath = string;

const fetcher = (baseUrl: string) => async (href: string) => {

    debug("fetcher", href);
    href = url.resolve(baseUrl, href);

    const res = await httpGet(href);

    try {
        ok(res.isSuccess, res.statusMessage);

        return await res.response.buffer();

    } catch (e) {
        debug("error to fetch", e);
    }
    return undefined;
};

const copyAndSetHref = (lns: Link[], hrefMapToFind: string[][]) =>
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

function* createZip(
    manifestBuffer: Buffer,
    resourcesMap: string[][],
) {

    debug("creation of the zip package .webpub");
    const pathFile = yield* callTyped(downloadCreatePathDir, nanoid(8));

    const p = async () => new Promise((resolve, reject) => {

        debug("package path", pathFile);

        const zipfile = new ZipFile();

        const packagePath = path.resolve(pathFile, "package.webpub");
        const writeStream = createWriteStream(packagePath);
        zipfile.outputStream.pipe(writeStream)
            .on("close", () => {

                debug("package done");
                resolve();
            })
            .on("error", (e: any) => reject(e));

        zipfile.addBuffer(manifestBuffer, "manifest.json");

        resourcesMap.forEach(([fsPath, , zipPath]) => {
            zipfile.addFile(fsPath, zipPath);
        });

        zipfile.end();
    });

    yield* callTyped(p);

}

function* downloadResources(
    r2Publication: R2Publication,
    title: string,
    baseUrl: string,
) {
    const uResources = getUniqueResourcesFromR2Publication(r2Publication);

    const resourcesHref = [...new Set(linksToArray(uResources))];
    const resourcesHrefResolved = resourcesHref.map((l) => url.resolve(baseUrl, l));

    const pathArray = yield* callTyped(downloader, resourcesHrefResolved, title);

    const resourcesHrefMap = pathArray.map(
        (fsPath, idx) => [
            fsPath,
            resourcesHref[idx],
            nanoid(8) + "/" + path.basename(resourcesHrefResolved[idx]),
        ],
    );

    return resourcesHrefMap;
}

function updateManifest(
    r2Publication: R2Publication,
    resourcesHrefMap: string[][],
) {
    {
        const readingOrders = r2Publication.Spine;
        if (Array.isArray(readingOrders)) {
            r2Publication.Spine = copyAndSetHref(readingOrders, resourcesHrefMap);
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

export function* packageFromLink(
    href: string,
    isHtml: boolean,
): SagaGenerator<TPath | undefined> {

    const manifest = yield* callTyped(packageGetManifestBuffer, href, isHtml);
    if (manifest) {

        const fetch = fetcher(href);

        let r2Publication: R2Publication;
        try {

            const manifestJson = JSON.parse(manifest.toString());
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
        } catch (e) {
            debug("error to find or parse a manifest");
            debug(e);
        }

        try {

            if (r2Publication) {
                debug("ready to package the r2Publication");
                debug(r2Publication);

                const resourcesHrefMap = yield* callTyped(
                    downloadResources,
                    r2Publication,
                    href,
                    href,
                );

                r2Publication = updateManifest(r2Publication, resourcesHrefMap);

                const manifestSerialize = TaJsonSerialize(r2Publication);
                const manifestString = JSON.stringify(manifestSerialize);
                const manifestBuffer = Buffer.from(manifestString);

                // create the .webpub zip package
                yield* callTyped(createZip, manifestBuffer, resourcesHrefMap);
            } else {
                debug("r2Publication is undefined");
            }
        } catch (e) {
            debug("can't create the webpub ZIP", e);
        }

    }

    return undefined;
}

export function* packageGetManifestBuffer(
    href: string,
    isHtml: boolean,
): SagaGenerator<Buffer | undefined> {

    let manifestBuffer: Buffer;

    const fetch = fetcher(href);

    try {
        const data = yield* callTyped(httpGet, href);
        const { response, isSuccess } = data;

        let rawData: string;
        if (isSuccess) {
            rawData = yield* callTyped(() => response.text());

        } else {
            debug("error to fetch", href, data);
            throw new Error("error to fetch " + href);
        }

        if (isHtml) {

            const htmlBuffer = Buffer.from(rawData);
            manifestBuffer = yield* callTyped(
                findManifestFromHtmlEntryAndReturnBuffer,
                htmlBuffer,
                fetch,
            );

        } else {
            manifestBuffer = Buffer.from(rawData);
        }

    } catch (e) {
        debug("can't fetch url", href);

    }

    return manifestBuffer;
}
