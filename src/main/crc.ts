// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { crc32 } from "crc";
import * as fs from "fs";
import * as unzipper from "unzipper";

export async function extractCrc32OnZip(filePath: string) {
    let checksum = 0;
    return new Promise<string>((resolve, reject) => {
        const fd = fs.createReadStream(filePath);
        fd.on("end", () => resolve(checksum.toString(16)));

        const zipStream = fd.pipe(unzipper.Parse());
        zipStream.on("entry", (entry: unzipper.Entry) => {
            checksum = crc32((entry.vars.crc32 || 0).toString(16), checksum);
            entry.autodrain();
        });
        zipStream.on("error", (e) => reject(e));
    });
}
