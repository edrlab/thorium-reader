// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { createWriteStream } from "fs";
import { nanoid } from "nanoid";
import * as path from "path";
import { ZipFile } from "yazl";

import { createTempDir } from "../fs/path";

// Logger
const debug = debug_("readium-desktop:main#utils/zip/create");

export type TResourcesFSCreateZip = Array<[fsPath: string, zipPath: string]>;
export type TResourcesBUFFERCreateZip = Array<[chuncks: Buffer, zipPath: string]>;
export async function createWebpubZip(
    manifestBuffer: Buffer,
    resourcesMapFs: TResourcesFSCreateZip,
    resourcesMapBuffer?: TResourcesBUFFERCreateZip,
    name = "misc",
) {

    debug("creation of the zip package .webpub");
    const pathFile = await createTempDir(nanoid(8), name);
    const packagePath = path.resolve(pathFile, "package.webpub");

    await new Promise<void>((resolve, reject) => {

        debug("package path", pathFile);

        const zipfile = new ZipFile();

        const writeStream = createWriteStream(packagePath);
        zipfile.outputStream.pipe(writeStream)
            .on("close", () => {

                debug("package done");
                resolve();
            })
            .on("error", (e: any) => reject(e));

        zipfile.addBuffer(manifestBuffer, "manifest.json");

        resourcesMapFs.forEach(([fsPath, zipPath]) => {
            zipfile.addFile(fsPath, zipPath);
        });

        resourcesMapBuffer?.forEach(([buffer, zipPath]) => {
            zipfile.addBuffer(buffer, zipPath);
        });

        zipfile.end();
    });

    return packagePath;
}
