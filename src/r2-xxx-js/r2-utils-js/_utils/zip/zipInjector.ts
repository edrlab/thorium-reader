// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as fs from "fs";
import * as yauzl from "yauzl";
import * as yazl from "yazl";

const debug = debug_("r2:utils#zip/zipInjector");

enum InjectType {
    FILE,
    BUFFER,
    STREAM,
}

export function injectStreamInZip(
    destPathTMP: string,
    destPathFINAL: string,
    stream: NodeJS.ReadableStream,
    zipEntryPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zipError: (e: any) => void,
    doneCallback: () => void) {

    injectObjectInZip(destPathTMP, destPathFINAL,
        stream, InjectType.STREAM,
        zipEntryPath, zipError, doneCallback);
}

export function injectBufferInZip(
    destPathTMP: string,
    destPathFINAL: string,
    buffer: Buffer,
    zipEntryPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zipError: (e: any) => void,
    doneCallback: () => void) {

    injectObjectInZip(destPathTMP, destPathFINAL,
        buffer, InjectType.BUFFER,
        zipEntryPath, zipError, doneCallback);
}

export function injectFileInZip(
    destPathTMP: string,
    destPathFINAL: string,
    filePath: string,
    zipEntryPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zipError: (e: any) => void,
    doneCallback: () => void) {

    injectObjectInZip(destPathTMP, destPathFINAL,
        filePath, InjectType.FILE,
        zipEntryPath, zipError, doneCallback);
}

function injectObjectInZip(
    destPathTMP: string,
    destPathFINAL: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contentsToInject: any,
    typeOfContentsToInject: InjectType,
    zipEntryPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zipError: (e: any) => void,
    doneCallback: () => void) {

    yauzl.open(destPathTMP, { lazyEntries: true, autoClose: false }, (err, zip) => {
        if (err || !zip) {
            debug("yauzl init ERROR");
            zipError(err);
            return;
        }

        const zipfile = new yazl.ZipFile();

        zip.on("error", (erro) => {
            debug("yauzl ERROR");
            zipError(erro);
        });

        zip.readEntry(); // next (lazyEntries)
        zip.on("entry", (entry) => {
            // if (/\/$/.test(entry.fileName)) {
            if (entry.fileName[entry.fileName.length - 1] === "/") {
                // skip directories / folders
            } else if (entry.fileName === zipEntryPath) {
                // skip injected entry
            } else {
                // debug(entry.fileName);
                // debug(entry);
                zip.openReadStream(entry, (errz, stream) => {
                    if (err || !stream) {
                        debug("yauzl openReadStream ERROR");
                        debug(errz);
                        zipError(errz);
                        return;
                    }
                    // entry.uncompressedSize
                    const compress = entry.fileName !== "mimetype";
                    zipfile.addReadStream(stream, entry.fileName, { compress });
                });
            }
            zip.readEntry(); // next (lazyEntries)
        });

        zip.on("end", () => {
            debug("yauzl END");

            process.nextTick(() => {
                zip.close(); // not autoClose
            });

            if (typeOfContentsToInject === InjectType.FILE) {
                zipfile.addFile(contentsToInject as string, zipEntryPath);

            } else if (typeOfContentsToInject === InjectType.BUFFER) {
                zipfile.addBuffer(contentsToInject as Buffer, zipEntryPath);

            } else if (typeOfContentsToInject === InjectType.STREAM) {
                zipfile.addReadStream(contentsToInject as NodeJS.ReadableStream, zipEntryPath);

            } else {
                debug("yazl FAIL to inject! (unknown type)");
            }

            zipfile.end();

            const destStream2 = fs.createWriteStream(destPathFINAL);
            zipfile.outputStream.pipe(destStream2);
            // response.on("end", () => {
            // });
            destStream2.on("finish", () => {
                doneCallback();
            });
            destStream2.on("error", (ere) => {
                zipError(ere);
            });
        });

        zip.on("close", () => {
            debug("yauzl CLOSE");
        });
    });
}
