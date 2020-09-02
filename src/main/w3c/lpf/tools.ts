// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import * as os from "os";
import { basename, join } from "path";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";

import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";
import { zipLoadPromise } from "@r2-utils-js/_utils/zip/zipFactory";
import { injectBufferInZip } from "r2-utils-js/dist/es6-es2015/src/_utils/zip/zipInjector";

// Logger
const debug = debug_("readium-desktop:main#w3c/lpf/tools");

export async function copyAndMoveLpfToTmpWithNewExt(
    lpfPath: string,
    ext: string = acceptedExtensionObject.audiobook,
): Promise<string> {

    const tmpPathName = `${_APP_NAME}-lpfconverter-`;
    const tmpPath = os.tmpdir();

    let dirPath: string;
    try {
        // creates a unique temporary directory
        dirPath = await fsp.mkdtemp(join(tmpPath, tmpPathName));
    } catch (err) {
        return Promise.reject(`creates a unique temporary directory : ${err}`);
    }

    const lpfBasename = basename(lpfPath);
    const newBasename = `${lpfBasename}${ext}`;
    const newPath = join(dirPath, newBasename);

    debug(`LPFPATH=${lpfPath} COPYPATH=${newPath}`);

    return newPath;
}

export async function openAndExtractFileFromLpf(
    lpfPath: string,
    fileEntryPath = "publication.json",
): Promise<NodeJS.ReadableStream> {

    const zip = await zipLoadPromise(lpfPath);

    if (!zip.hasEntries()) {
        return Promise.reject("LPF zip empty");
    }

    if (zip.hasEntry(fileEntryPath)) {

        let entryStream: IStreamAndLength;
        try {
            entryStream = await zip.entryStreamPromise(fileEntryPath);

        } catch (err) {
            debug(err);
            return Promise.reject(`Problem streaming LPF zip entry?! ${fileEntryPath}`);
        }

        return entryStream.stream;

    }
        // return Promise.reject("LPF zip " + fileEntryPath + "is missing");

    return undefined;
}

export async function injectManifestToZip(
    sourcePath: string,
    destinationPath: string,
    bufferFile: Buffer,
    filename: string = "manifest.json",
) {

    return new Promise(
        (resolve, reject) => {
            injectBufferInZip(
                sourcePath,
                destinationPath,
                bufferFile,
                filename,
                (err) => {
                    debug("injectManifestToZip - injectBufferInZip ERROR!", err);
                    reject(`'injectBufferInZip' : ${err}`);
                },
                () => resolve(),
            );
        });
}
