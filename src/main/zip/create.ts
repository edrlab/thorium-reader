// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { createWriteStream } from "fs";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import { nanoid } from "nanoid";

import * as path from "path";
import { ZipFile } from "yazl";
import { EventEmitter } from "events";

import { createTempDir } from "../fs/path";

// Logger
const debug = debug_("readium-desktop:main#utils/zip/create");

// strictly not necessary here,
// but see LCP no-compression-before-encryption for "codec" media resources
// which are then STORE'd in the ZIP
// (=> no unnecessary / costly DEFLATE in the ZIP directory, net benefit when "streaming" with HTTP byte-ranges):
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L158-L170
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L130-L132
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L236-L239
// https://github.com/readium/readium-lcp-server/blob/e2c484f571a8013faf13a335c007890150751d79/pack/pack.go#L265-L267
// const doDeflate = (zipPath: string) => !/\.(PDF|PNG|JPE?G|MPE?G|HEIC|WEBP|MP3|MP4|WAV|OGG|AVI)$/i.test(zipPath);
const doDeflate = (_zipPath: string) => true;

export type TResourcesFSCreateZip = Array<[fsPath: string, zipPath: string]>;
export type TResourcesBUFFERCreateZip = Array<[chuncks: Buffer, zipPath: string]>;
export async function createWebpubZip(
    manifestBuffer: Buffer,
    resourcesMapFs: TResourcesFSCreateZip,
    resourcesMapBuffer?: TResourcesBUFFERCreateZip,
    name = "misc",
) {
    const pathFile = await createTempDir(nanoid(8), name);
    const packagePath = path.resolve(pathFile, "package.webpub");

    debug("createWebpubZip", packagePath);

    await new Promise<void>((resolve, reject) => {
        const zipfile = new ZipFile();

        // https://unpkg.com/browse/@types/yazl@2.4.5/index.d.ts
        // https://github.com/thejoshwolfe/yazl/blob/20584c378c654fc5b5ad141697ec539d7cb27c9e/index.js#L13
        if ((zipfile as unknown as EventEmitter).on)
        (zipfile as unknown as EventEmitter).on("error", (err) => {
            debug("createWebpubZip zipfile ERROR", packagePath, err);

            // reject(err);
        });

        const writeStream = createWriteStream(packagePath);
        writeStream.on("end", () => {
            debug("createWebpubZip writeStream END", packagePath);
        });
        writeStream.on("finish", () => {
            debug("createWebpubZip writeStream FINISH", packagePath);
        });
        writeStream.on("close", () => {
            debug("createWebpubZip writeStream CLOSE", packagePath);

            resolve();
        });
        writeStream.on("error", (err) => {
            debug("createWebpubZip writeStream ERROR", packagePath, err);

            reject(err);
        });

        zipfile.outputStream.on("end", () => {
            debug("createWebpubZip zipfile.outputStream END", packagePath);
        });
        zipfile.outputStream.on("finish", () => {
            debug("createWebpubZip zipfile.outputStream FINISH", packagePath);
        });
        zipfile.outputStream.on("close", () => {
            debug("createWebpubZip zipfile.outputStream CLOSE", packagePath);
        });
        zipfile.outputStream.on("error", (err) => {
            debug("createWebpubZip zipfile.outputStream ERROR", packagePath, err);
        });

        zipfile.outputStream.pipe(writeStream);

        debug("createWebpubZip addBuffer", "manifest.json");
        zipfile.addBuffer(manifestBuffer, "manifest.json", { compress: true });

        resourcesMapFs.forEach(([fsPath, zipPath]) => {
            const compress = doDeflate(zipPath);
            debug("createWebpubZip addFile", zipPath, compress);
            zipfile.addFile(fsPath, zipPath, { compress });
        });

        resourcesMapBuffer?.forEach(([buffer, zipPath]) => {
            const compress = doDeflate(zipPath);
            debug("createWebpubZip addBuffer", zipPath, compress);
            zipfile.addBuffer(buffer, zipPath, { compress });
        });

        debug("createWebpubZip ENDING ...", packagePath);
        zipfile.end();
    });

    return packagePath;
}
