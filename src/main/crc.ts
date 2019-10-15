// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { crc32 } from "crc";
import * as yauzl from "yauzl";

type TCrcFile = [string, string];

export async function extractCrc32OnZip(filePath: string) {
    const fileArray: TCrcFile[] = [];
    return new Promise<string>((resolve, reject) => {

        yauzl.open(filePath, { lazyEntries: true }, (err, data) => {
            if (err) {
                reject(err);
            }
            data.on("error", (e) => reject(e));
            data.readEntry();
            data.on("entry", (entry: yauzl.Entry) => {
                fileArray.push([entry.fileName, (entry.crc32 || 0).toString(16)]);
                data.readEntry();
            });
            data.on("end", () => {
                const sortArray = fileArray.sort((a, b) => a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1);
                console.log("sortArray:", sortArray);
                const checksum = sortArray.reduce((prev, curr) => crc32(curr[1], prev), 0);
                resolve(checksum.toString(16));
            });
        });

        /*
        const fd = fs.createReadStream(filePath);

        const zipStream = fd.pipe(unzipper.Parse());
        zipStream.on("entry", (entry: unzipper.Entry) => {
            // console.log("entry: ", entry.path);
            fileArray.push([entry.path, (entry.vars.crc32 || 0).toString(16)]);
            entry.autodrain();
        });
        zipStream.on("error", (e) => reject(e));
        zipStream.on("end", () => {
            const sortArray = fileArray.sort((a, b) => a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1 );
            console.log("sortArray:", sortArray);
            const checksum = sortArray.reduce((prev, curr) => crc32(curr[1], prev), 0);
            resolve(checksum.toString(16));
        });
        zipStream.on("end", () => console.log("end zip"));
        */
    });
}
