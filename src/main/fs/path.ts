// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";

// Logger
const debug = debug_("readium-desktop:main#fs/path");

export async function createTempDir(id: string, name = "download"): Promise<string> {
    // /tmp/thorium/download/{unixtimestamp}/name.ext

    const tmpDir = tmpdir();
    let pathDir = tmpDir;
    try {
        pathDir = path.resolve(tmpDir, _APP_NAME.toLowerCase(), name, id);
        await fs.promises.mkdir(pathDir, { recursive: true });

    } catch (err) {
        debug(err, err.trace);

        try {
            pathDir = path.resolve(tmpDir, id.toString());
            await fs.promises.mkdir(pathDir);
        } catch (err) {
            debug(err, err.trace, err.code);

            if (err.code !== "EEXIST") {

                throw new Error("Error to create directory: " + pathDir);
            }

        }
    }
    return pathDir;
}
