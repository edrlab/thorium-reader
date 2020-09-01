// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import { dirname } from "path";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";

import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

import {
    Iw3cPublicationManifest, w3cPublicationManifestToReadiumPublicationManifest,
} from "../audiobooks/converter";
import {
    copyAndMoveLpfToTmpWithNewExt, injectManifestToZip, openAndExtractFileFromLpf,
} from "./tools";

// Logger
const debug = debug_("readium-desktop:main#w3c/lpf/audiobookConverter");
debug("_");

//
// API
//
export async function lpfToAudiobookConverter(lpfPath: string): Promise<[string, () => Promise<void>]> {

    const audiobookPath = await copyAndMoveLpfToTmpWithNewExt(lpfPath);

    const stream = await openAndExtractFileFromLpf(lpfPath);

    const buffer = await streamToBufferPromise(stream);
    const rawData = buffer.toString("utf8");
    const w3cManifest = JSON.parse(rawData) as Iw3cPublicationManifest;

    const readiumManifest = w3cPublicationManifestToReadiumPublicationManifest(w3cManifest);

    const manifestJson = JSON.stringify(readiumManifest, null, 4);
    const manifestBuffer = Buffer.from(manifestJson);
    await injectManifestToZip(lpfPath, audiobookPath, manifestBuffer);

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
