// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import { dirname } from "path";
import { readStreamToBuffer } from "readium-desktop/main/stream/stream";
import { extractFileFromZip } from "readium-desktop/main/zip/extract";

import { TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import {
    Iw3cPublicationManifest, w3cPublicationManifestToReadiumPublicationManifest,
} from "../audiobooks/converter";
import { findManifestFromHtmlEntryAndReturnBuffer } from "../audiobooks/entry";
import { findHtmlTocInRessources } from "../audiobooks/toc";
import { copyAndMoveLpfToTmpWithNewExt, injectManifestToZip } from "./tools";

// Logger
const debug = debug_("readium-desktop:main#w3c/lpf/audiobookConverter");
debug("_");

const fetcher = (lpfPath: string) =>
    async (url: string) => {
        const stream = await extractFileFromZip(lpfPath, url);
        const buffer = readStreamToBuffer(stream);
        return buffer;
    };

async function extractConvertAndInjectManifest(
    lpfPath: string,
    audiobookPath: string,
    buffer: Buffer,
) {

    const rawData = buffer.toString("utf8");
    const w3cManifest = JSON.parse(rawData) as Iw3cPublicationManifest;

    const fetch = fetcher(lpfPath);

    const publication = await w3cPublicationManifestToReadiumPublicationManifest(
        w3cManifest,
        async (uniqRessources: Link[]) => {
            return findHtmlTocInRessources(uniqRessources, fetch);
        },
    );

    const publicationJson = TaJsonSerialize<R2Publication>(publication);
    const manifestJson = JSON.stringify(publicationJson, null, 4);
    const manifestBuffer = Buffer.from(manifestJson);

    await injectManifestToZip(lpfPath, audiobookPath, manifestBuffer);
}

export async function findManifestAndReturnBuffer(lpfPath: string) {

    {
        // extract the manifest from lpf
        const publicationStream = await extractFileFromZip(lpfPath, "publication.json");
        const publicationBuffer = await readStreamToBuffer(publicationStream);
        if (publicationBuffer) {
            return publicationBuffer;
        }
    }

    {

        const fetch = fetcher(lpfPath);

        // extract the manifest from lpf html entry
        const htmlStream = await extractFileFromZip(lpfPath, "index.html");
        const htmlBuffer = await readStreamToBuffer(htmlStream);
        if (htmlBuffer) {
            const [publicationBuffer] = await findManifestFromHtmlEntryAndReturnBuffer(
                htmlBuffer,
                fetch,
            );
            return publicationBuffer;
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
    } else {

        debug("ERROR no manifest found in lpfPath");
    }

    const cleanFct = async () => {
        try {
            await fsp.unlink(audiobookPath);
            await fsp.rmdir(dirname(audiobookPath));
        } catch (_err) {
            // ignore
        }
    };

    if (__TH__IS_DEV__) {

        return [audiobookPath, async () => { /* no op */ }];
    } else {

        return [audiobookPath, cleanFct];
    }
}
