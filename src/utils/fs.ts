// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

export async function rmDirAsync(dirPath: string) {

    try {
        const filenames = await promisify(fs.readdir)(dirPath);

        for (const filename of filenames) {
            const filePath = path.join(dirPath, filename);

            if ((await promisify(fs.stat)(filePath)).isFile()) {
                await promisify(fs.unlink)(filePath);
            } else {
                await rmDirAsync(filePath);
            }
        }

        await promisify(fs.rmdir)(dirPath);

    } catch (e) {
        console.error(e);
    }
}

export function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}
