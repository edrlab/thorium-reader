// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";

import { readStreamToBuffer } from "../stream/stream";

// Logger
const debug = debug_("readium-desktop:main#utils/zip");
debug("_");

export async function extractFileFromZip(
    zipPath: string,
    fileEntryPath: string /*= "publication.json"*/,
): Promise<NodeJS.ReadableStream> {

    const zip = await zipLoadPromise(zipPath);

    if (!zip.hasEntries()) {
        // return Promise.reject("LPF zip empty");
        return undefined;
    }

    if (zip.hasEntry(fileEntryPath)) {
        const entryStream = await zip.entryStreamPromise(fileEntryPath);
        return entryStream.stream;
    }

    return undefined;
}

export async function extractFileFromZipToBuffer(
    zipPath: string,
    filename: string,
): Promise<Buffer | undefined> {

    const publicationStream = await extractFileFromZip(zipPath, filename);
    const publicationBuffer = await readStreamToBuffer(publicationStream);
    return publicationBuffer;
}
