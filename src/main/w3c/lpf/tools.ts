// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// e__slint-disable-next-line @typescript-eslint/ban-ts-comment
// @__ts-ignore TS1479
import { nanoid } from "nanoid";

import * as os from "os";
import * as path from "path";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";

// import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";
import { injectBufferInZip } from "../../tools/zipInjector";

// Logger
const debug = debug_("readium-desktop:main#w3c/lpf/tools");

export async function copyAndMoveLpfToTmpWithNewExt(
    lpfPath: string,
    ext: string = acceptedExtensionObject.audiobook,
): Promise<string> {

    const tmpPathName = "lpfconverter";
    const tmpPath = os.tmpdir();

    // creation of a unique temporary directory
    let pathDir: string;
    try {
        pathDir = path.resolve(tmpPath, _APP_NAME.toLowerCase(), tmpPathName, nanoid(8));
        await fs.promises.mkdir(pathDir, { recursive: true });

    } catch (_e) {

        pathDir = await fs.promises.mkdtemp(`${_APP_NAME.toLowerCase()}-${tmpPathName}`);
    }

    const lpfBasename = path.basename(lpfPath);
    const newBasename = `${lpfBasename}${ext}`;
    const newPath = path.resolve(pathDir, newBasename);

    debug(`LPFPATH=${lpfPath} COPYPATH=${newPath}`);

    return newPath;
}

export async function injectManifestToZip(
    sourcePath: string,
    destinationPath: string,
    bufferFile: Buffer,
    filename = "manifest.json",
) {

    return new Promise<void>(
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
