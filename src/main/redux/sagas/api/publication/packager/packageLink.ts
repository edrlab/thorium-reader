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
import { basename, resolve } from "path";
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
import { ZipFile } from "yazl";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { downloadCreatePathDir, downloader } from "../../../downloader";
import { manifestContext } from "./context";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/packager/packageLink");

type TPath = string;

const fetcher = async (href: string) => {

    const res = await httpGet(href);

    try {
        ok(res.isSuccess, res.statusMessage);

        return await res.response.buffer();

    } catch (e) {
        debug("error to fetch", e);
    }
    return undefined;
};

export function* packageFromLink(
    url: URL,
    isHtml: boolean,
): SagaGenerator<TPath | undefined> {

    const manifest = yield* callTyped(packageGetManifestBuffer, url, isHtml);
    if (manifest) {

        const manifestJson = JSON.parse(manifest.toString());
        const [isR2, isW3] = manifestContext(manifestJson);

        let r2Publication: R2Publication;
        if (isW3) {

            r2Publication = yield* callTyped(
                w3cPublicationManifestToReadiumPublicationManifest,
                manifestJson,
                async (resources) => findHtmlTocInRessources(resources, fetcher),
            );
        } else if (isR2) {

            r2Publication = TaJsonDeserialize(manifestJson, R2Publication);
        }

        if (r2Publication) {

            const uResources = getUniqueResourcesFromR2Publication(r2Publication);

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

            const resourcesHref = [...new Set(linksToArray(uResources))];
            const pathArray = yield* callTyped(downloader, resourcesHref, url.toString());

            const resourcesHrefMap = pathArray.map(
                (dPath, idx) => [path, resourcesHref[idx], nanoid(8) + "/" + basename(dPath)],
            );

            const copyAndSetHref = (lns: Link[], hrefMapToFind: typeof resourcesHrefMap) =>
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

            const manifestSerialize = TaJsonSerialize(r2Publication);
            const manifestBuffer = Buffer.from(manifestSerialize);

            const path = yield* callTyped(downloadCreatePathDir, "packager");

            const zipfile = new ZipFile();

            const packagePath = resolve(path, "package.webpub");
            const writeStream = createWriteStream(packagePath);
            zipfile.outputStream.pipe(writeStream)
                .on("close", () => {
                    debug("done");
                });
            zipfile.addBuffer(manifestBuffer, "manifest.json");

            resourcesHrefMap.forEach(([fsPath, , zipPath]) => {
                zipfile.addFile(fsPath, zipPath);
            });

            zipfile.end();
        }

        // create the .webpub zip package
    }

    return undefined;
}

export function* packageGetManifestBuffer(
    url: URL,
    isHtml: boolean,
): SagaGenerator<Buffer | undefined> {

    let manifestBuffer: Buffer;

    try {
        const data = yield* callTyped(httpGet, url);
        const { response, isSuccess } = data;

        let rawData: string;
        if (isSuccess) {
            rawData = yield* callTyped(() => response.text());

        } else {
            debug("error to fetch", url.toString(), data);
            throw new Error("error to fetch " + url.toString());
        }

        if (isHtml) {

            const htmlBuffer = Buffer.from(rawData);
            manifestBuffer = yield* callTyped(
                findManifestFromHtmlEntryAndReturnBuffer,
                htmlBuffer,
                fetcher,
            );

        } else {
            manifestBuffer = Buffer.from(rawData);
        }

    } catch (e) {
        debug("can't fetch url", url.toString());

    }

    return manifestBuffer;
}
