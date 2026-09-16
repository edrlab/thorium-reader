// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ZipFile } from "yazl";

import { ANNOTATIONS_JSON_FILENAME } from "readium-desktop/common/extension";

export function createDetachedAnnotationPackage(serializedAnnotationSet: string): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
        const zipFile = new ZipFile();
        const chunks: Buffer[] = [];

        zipFile.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
        zipFile.outputStream.once("error", reject);
        zipFile.outputStream.once("end", () => {
            const archive = Buffer.concat(chunks);
            resolve(archive.buffer.slice(
                archive.byteOffset,
                archive.byteOffset + archive.byteLength,
            ) as ArrayBuffer);
        });

        zipFile.addBuffer(Buffer.from(serializedAnnotationSet, "utf8"), ANNOTATIONS_JSON_FILENAME);
        zipFile.end();
    });
}
