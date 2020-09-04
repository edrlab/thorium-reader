// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import * as debug_ from "debug";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { httpGet } from "readium-desktop/main/http";
import {
    findManifestFromHtmlEntryAndReturnBuffer,
} from "readium-desktop/main/w3c/audiobooks/entry";
import { SagaGenerator } from "typed-redux-saga";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { manifestContext } from "./context";
import { w3cPublicationManifestToReadiumPublicationManifest, getUniqueResourcesFromR2Publication } from "readium-desktop/main/w3c/audiobooks/converter";
import { TaJsonSerialize, TaJsonDeserialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/packager/packageLink");

type TPath= string;

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
                async (resources) => 
            );
        } else if (isR2) {

            r2Publication = TaJsonDeserialize(manifestJson, R2Publication);
        }

        if (r2Publication) {

            const ressources = getUniqueResourcesFromR2Publication(r2Publication);

            const hrefArray = ressources.map((l))
        }

        // download ressources

        // update manifest

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
                async (href: string) => {

                    const res = await httpGet(href);

                    try {
                        ok(res.isSuccess, res.statusMessage);

                        return await res.response.buffer();

                    } catch (e) {
                        debug("error to fetch", e);
                    }
                    return undefined;
                },
            );

        } else {
            manifestBuffer = Buffer.from(rawData);
        }

    } catch (e) {
        debug("can't fetch url", url.toString());

    }

    return manifestBuffer;
}
