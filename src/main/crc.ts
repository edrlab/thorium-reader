// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import * as yauzl from "yauzl";

type TCrcFile = [string, number];

const debug = debug_("readium-desktop:main/crc");

export async function extractCrc32OnZip(filePath: string) {
    const fileArray: TCrcFile[] = [];
    return new Promise<string>((resolve, reject) => {

        yauzl.open(filePath, { lazyEntries: true }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            data.readEntry();

            data.on("error", (e) => reject(e));
            data.on("entry", (entry: yauzl.Entry) => {
                fileArray.push([entry.fileName, entry.crc32 || 0]);
                data.readEntry();
            });
            data.on("end", () => {
                const sortArray = fileArray.sort((a, b) => a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1);
                const checksum = sortArray.reduce((prev, curr) => prev + curr[1].toString(16), "");
                const hash = crypto.createHash("sha1").update(checksum).digest("hex");
                debug(filePath, hash);
                process.nextTick(() => data.close());
                resolve(hash);
            });
        });
    });
}
