// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import { TaJsonSerialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";

import { createWebpubZip } from "../zip/create";
import { pdfCover } from "./cover";
import { pdfManifest } from "./manifest";

// Logger
const debug = debug_("readium-desktop:main/pdf/packager");

//
// API
//
export async function pdfPackager(pdfPath: string): Promise<string> {

    debug("pdf packager", pdfPath);

    const manifest = await pdfManifest(pdfPath);
    const manifestJson = TaJsonSerialize(manifest);
    const manifestStr = JSON.stringify(manifestJson);
    const manifestBuf = Buffer.from(manifestStr);

    debug("manifest");
    debug(manifest);

    const pngBuffer = await pdfCover(pdfPath, manifest);
    const pngName = manifest?.Resources[0]?.Href;

    debug("cover", pngName);
    debug(pngBuffer);

    const pdfBuffer = await fsp.readFile(pdfPath);
    const pdfName = manifest?.Spine[0]?.Href;

    debug("pdf", pdfName);
    debug(pdfBuffer);

    const webpubPath = await createWebpubZip(
        manifestBuf,
        [],
        [
            [pngBuffer, pngName],
            [pdfBuffer, pdfName],
        ],
        "pdf",
    );

    return webpubPath;
}
