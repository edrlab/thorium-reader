// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import { JSDOM } from "jsdom";
import { dirname } from "path";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";

import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

import {
    Iw3cPublicationManifest, w3cPublicationManifestToReadiumPublicationManifest,
} from "../audiobooks/converter";
import { findHtmlTocInRessources } from "../audiobooks/toc";
import {
    copyAndMoveLpfToTmpWithNewExt, injectManifestToZip, openAndExtractFileFromLpf,
} from "./tools";

// Logger
const debug = debug_("readium-desktop:main#w3c/lpf/audiobookConverter");
debug("_");

async function extractConvertAndInjectManifest(
    lpfPath: string,
    audiobookPath: string,
    buffer: Buffer,
) {

    const rawData = buffer.toString("utf8");
    const w3cManifest = JSON.parse(rawData) as Iw3cPublicationManifest;

    const readiumManifest = await w3cPublicationManifestToReadiumPublicationManifest(
        w3cManifest,
        async (uniqRessources: Link[]) => {
            return findHtmlTocInRessources(lpfPath, uniqRessources);
        },
    );

    const manifestJson = JSON.stringify(readiumManifest, null, 4);
    const manifestBuffer = Buffer.from(manifestJson);
    await injectManifestToZip(lpfPath, audiobookPath, manifestBuffer);
}

async function findManifestAndReturnBuffer(lpfPath: string): Promise<Buffer> {

    const publicationStream = await openAndExtractFileFromLpf(lpfPath);
    if (publicationStream) {

        const buffer = await streamToBufferPromise(publicationStream);
        return buffer;

    } else {
        try {

            const htmlStream = await openAndExtractFileFromLpf(lpfPath, "index.html");
            if (htmlStream) {

                // extract the manifest from lpf
                const htmlBuffer = await streamToBufferPromise(htmlStream);
                const text = htmlBuffer.toString("utf8");

                try {

                    const { window } = new JSDOM(text);
                    const el: HTMLLinkElement = window.document.querySelector("link[rel=\"publication\"]");
                    if (el) {
                        const url = el.hasAttribute("href") ? el.href : undefined;
                        if (url[0] === "#") {
                            const scriptEl: HTMLScriptElement = window.document.querySelector("script" + url);
                            if (scriptEl && scriptEl.innerText) {
                                const bufferManifest = Buffer.from(scriptEl.innerText);
                                return bufferManifest;
                            }

                        } else {

                            const w3cManifestStream = await openAndExtractFileFromLpf(lpfPath, url);
                            if (w3cManifestStream) {
                                const bufferManifest = await streamToBufferPromise(publicationStream);
                                return bufferManifest;

                            } else {
                                throw new Error("w3c manifest not found");
                            }
                        }
                    }

                } catch (e) {
                    debug("error to parse html", e);
                }

            } else {
                throw new Error("publication.json and/or index.html are missing");
            }
        } catch (e) {
            debug("error to extract html from lpf", e);
        }
    }

    return undefined;
}

//
// API
//
export async function lpfToAudiobookConverter(lpfPath: string): Promise<[string, () => Promise<void>]> {

    const audiobookPath = await copyAndMoveLpfToTmpWithNewExt(lpfPath);

    const manifestBuffer = await findManifestAndReturnBuffer(lpfPath);
    if (manifestBuffer) {

        await extractConvertAndInjectManifest(lpfPath, audiobookPath, manifestBuffer);
    }

    const cleanFct = async () => {
        try {
            await fsp.unlink(audiobookPath);
            await fsp.rmdir(dirname(audiobookPath));
        } catch (err) {
            // ignore
        }
    };
    return [audiobookPath, cleanFct];
}
