// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "node:fs";
import path from "node:path";
import StreamZip from "node-stream-zip";

import { ANNOTATIONS_JSON_FILENAME, EXT_ANNOTATIONS, EXT_ANNOTATIONS_LEGACY } from "readium-desktop/common/extension";

async function readDetachedAnnotationPackage(filePath: string): Promise<string> {
    const zip = new StreamZip.async({ file: filePath });

    try {
        const entry = await zip.entry(ANNOTATIONS_JSON_FILENAME);
        if (!entry || entry.isDirectory) {
            throw new Error(`The annotation package does not contain a root-level ${ANNOTATIONS_JSON_FILENAME} file.`);
        }

        const data = await zip.entryData(entry);
        return data.toString("utf8");
    } finally {
        await zip.close().catch((): void => undefined);
    }
}

export async function readAnnotationSetFile(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === EXT_ANNOTATIONS_LEGACY) {
        return fs.promises.readFile(filePath, { encoding: "utf8" });
    }
    if (extension === EXT_ANNOTATIONS) {
        return readDetachedAnnotationPackage(filePath);
    }

    throw new Error(`Unsupported annotation file extension: ${extension}`);
}
