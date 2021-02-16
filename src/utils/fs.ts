// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";
import * as path from "path";

export function rmDirSync(dirPath: string): void {
    let filenames = [];

    try {
        filenames = fs.readdirSync(dirPath);
    } catch (_err) {
        return;
    }

    for (const filename of filenames) {
        const filePath = path.join(dirPath, filename);

        if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
        } else {
            rmDirSync(filePath);
        }
    }

    fs.rmdirSync(dirPath);
}

export function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}
