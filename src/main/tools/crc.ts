// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import * as fs from "fs";
import * as yauzl from "yauzl";

const debug = debug_("readium-desktop:main/crc");

export async function computeFileHash(filePath: string) {
    return new Promise<string>((resolve, _reject) => {
        const algo = crypto.createHash("sha1");
        const stream = fs.createReadStream(filePath);
        stream.on("readable", () => {
            const data = stream.read();
            if (data) {
                algo.update(data);
            } else {
                process.nextTick(() => {
                    try {
                        stream.destroy();
                    } catch (err) {
                        console.log(`ERROR CLOSING STREAM: ${filePath}`);
                        console.log(err);
                    }
                });

                const hash = algo.digest("hex");
                resolve(hash);
            }
        });
    });
}

const DEBUG_VERBOSE = false;

// type TCrcFile = [string, number];

export async function extractCrc32OnZip(inputZipFilePath: string) {
    // const zipEntryFileNameCrcArray: TCrcFile[] = [];
    const cryptoHash = crypto.createHash("sha1").update("|");

    return new Promise<string>((resolve, reject) => {

        yauzl.open(inputZipFilePath, { lazyEntries: true, autoClose: false }, (inputZipOpenError, inputZip) => {
            if (inputZipOpenError || !inputZip) {
                debug("yauzl.open ERROR", inputZipOpenError);

                reject(inputZipOpenError);
                return;
            }

            inputZip.on("error", (inputZipError) => {
                debug("inputZip ERROR", inputZipError);

                reject(inputZipError);
            });

            inputZip.on("close", () => {
                if (DEBUG_VERBOSE) debug("inputZip CLOSE");
            });
            inputZip.on("finish", () => {
                if (DEBUG_VERBOSE) debug("inputZip FINISH");
            });
            inputZip.on("end", () => {
                if (DEBUG_VERBOSE) debug("inputZip END");

                // const checksum = zipEntryFileNameCrcArray.reduce((prev, curr) => prev + curr[1].toString(16) + "|", "|");
                // const hash = crypto.createHash("sha1").update(checksum).digest("hex");

                const hash = cryptoHash.digest("hex");

                debug(inputZipFilePath, hash);

                process.nextTick(() => inputZip.close());

                resolve(hash);
            });

            inputZip.on("entry", (inputZipEntry: yauzl.Entry) => {
                if (DEBUG_VERBOSE) debug("inputZip END", inputZipEntry.fileName);

                // extractCrc32OnZip() is still called with LCP publications
                // (see "redoHash" or more generally "__LCP_LSD_UPDATE_COUNT")
                // which is okay because legacy / pubs imported before this change
                // benefit from the removal of "META-INF/license.lcpl" from the calculation.
                if (inputZipEntry.fileName !== "META-INF/license.lcpl") {
                    // zipEntryFileNameCrcArray.push([inputZipEntry.fileName, inputZipEntry.crc32 || 0]);
                    cryptoHash.update((inputZipEntry.crc32 || 0).toString(16) + "|");
                }

                // process.nextTick(() => inputZip.readEntry());
                inputZip.readEntry();
            });
            inputZip.readEntry();
        });
    });
}
