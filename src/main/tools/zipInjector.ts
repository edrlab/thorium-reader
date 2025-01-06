// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// WAS:
// import { injectBufferInZip } from "@r2-utils-js/_utils/zip/zipInjector";

import * as debug_ from "debug";
import EventEmitter from "events";
import * as fs from "fs";
import * as yauzl from "yauzl";
import * as yazl from "yazl";

const debug = debug_("readium-desktop:main/zipInjector");

const DEBUG_VERBOSE = false;

enum InjectType {
    FILE,
    BUFFER,
    STREAM,
}

// export function injectStreamInZip(
//     destPathTMP: string,
//     destPathFINAL: string,
//     stream: NodeJS.ReadableStream,
//     zipEntryPath: string,
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     zipError: (e: any) => void,
//     doneCallback: () => void) {

//     injectObjectInZip(destPathTMP, destPathFINAL,
//         stream, InjectType.STREAM,
//         zipEntryPath, zipError, doneCallback);
// }

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

// export function injectFileInZip(
//     destPathTMP: string,
//     destPathFINAL: string,
//     filePath: string,
//     zipEntryPath: string,
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     zipError: (e: any) => void,
//     doneCallback: () => void) {

//     injectObjectInZip(destPathTMP, destPathFINAL,
//         filePath, InjectType.FILE,
//         zipEntryPath, zipError, doneCallback);
// }

function injectObjectInZip(
    inputZipFilePath: string,
    outputZipFilePath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toInject: any,
    typeToInject: InjectType,
    toInjectZipEntryPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (e: any) => void,
    resolve: () => void) {

    debug("input ZIP", inputZipFilePath);
    debug("output ZIP", outputZipFilePath);

    // TODO: do not DEFLATE encrypted resources (regardless of whether they are compressed-before-encrypted ... they must be STORE'd in the ZIP directory)
    const doCompressInjected = toInjectZipEntryPath !== "mimetype";

    debug("inject in ZIP", toInjectZipEntryPath, typeToInject, doCompressInjected);

    yauzl.open(inputZipFilePath, { lazyEntries: true, autoClose: false }, (inputZipOpenError, inputZip) => {
        let rejected = false;

        if (inputZipOpenError || !inputZip) {
            debug("yauzl.open ERROR", inputZipOpenError);

            if (!rejected) {
                rejected = true;
                reject(inputZipOpenError);
            }
            return;
        }

        const outputZip = new yazl.ZipFile();

        if ((outputZip as unknown as EventEmitter).on)
        (outputZip as unknown as EventEmitter).on("error", (outputZipError) => {
            debug("outputZip ERROR", outputZipError);

            if (!rejected) {
                rejected = true;
                reject(outputZipError);
            }
        });

        const outputZipWriteStream = fs.createWriteStream(outputZipFilePath);
        outputZip.outputStream.pipe(outputZipWriteStream);
        outputZipWriteStream.on("end", () => {
            debug("outputZipWriteStream END");
        });
        outputZipWriteStream.on("close", () => {
            debug("outputZipWriteStream CLOSE");
        });
        outputZipWriteStream.on("finish", () => {
            debug("outputZipWriteStream FINISH");

            resolve();
        });
        outputZipWriteStream.on("error", (outputZipWriteStreamError) => {
            debug("outputZipWriteStream ERROR");

            if (!rejected) {
                rejected = true;
                reject(outputZipWriteStreamError);
            }
        });

        let inputZipReadEntriesDone = false;

        inputZip.on("close", () => {
            debug("inputZip CLOSE");
        });
        inputZip.on("finish", () => {
            debug("inputZip FINISH");
        });
        inputZip.on("error", (inputZipError) => {
            debug("inputZip ERROR");

            if (!rejected) {
                rejected = true;
                reject(inputZipError);
            }
        });

        inputZip.on("end", () => {
            debug("inputZip END");

            inputZipReadEntriesDone = true;
        });
        inputZip.on("endX", () => {
            debug("inputZip ENDx");

            process.nextTick(() => {
                debug("inputZip CLOSING...");
                inputZip.close(); // not autoClose
            });

            if (typeToInject === InjectType.FILE) {
                outputZip.addFile(toInject as string, toInjectZipEntryPath, { compress: doCompressInjected });
            } else if (typeToInject === InjectType.BUFFER) {
                outputZip.addBuffer(toInject as Buffer, toInjectZipEntryPath, { compress: doCompressInjected });
            } else if (typeToInject === InjectType.STREAM) {
                outputZip.addReadStream(toInject as NodeJS.ReadableStream, toInjectZipEntryPath, { compress: doCompressInjected });
            } else {
                debug("INCORRECT TYPE!!??", typeToInject);
            }

            debug("outputZip ENDING...");
            outputZip.end();
        });

        const pendingOutputZipEntries = new Set<string>();
        inputZip.on("entry", (inputZipEntry: yauzl.Entry) => {
            if (DEBUG_VERBOSE) debug("inputZip ENTRY", inputZipEntry.fileName);

            // if (/\/$/.test(entry.fileName)) {
            if (inputZipEntry.fileName[inputZipEntry.fileName.length - 1] === "/") {
                // skip directories / folders
                if (DEBUG_VERBOSE) debug("inputZip ENTRY folder", inputZipEntry.fileName);
            } else if (inputZipEntry.fileName === toInjectZipEntryPath) {
                // skip injected entry
                debug("inputZip ENTRY already exists (will be overwritten)", inputZipEntry.fileName);
            } else {
                // TODO: do not DEFLATE encrypted resources (regardless of whether they are compressed-before-encrypted ... they must be STORE'd in the ZIP directory)
                const doCompress = inputZipEntry.fileName !== "mimetype";

                if (DEBUG_VERBOSE) debug("inputZip ENTRY copy-over", inputZipEntry.fileName, doCompress, pendingOutputZipEntries.size, JSON.stringify(Array.from(pendingOutputZipEntries)));

                pendingOutputZipEntries.add(inputZipEntry.fileName);

                // zipfile.addReadStream(stream, entry.fileName, { compress });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (outputZip as any).addReadStreamLazy(inputZipEntry.fileName, { compress: doCompress }, (streamCallback: any) => {
                    if (DEBUG_VERBOSE) debug("outputZip addReadStreamLazy", inputZipEntry.fileName, doCompress, pendingOutputZipEntries.size, JSON.stringify(Array.from(pendingOutputZipEntries)));

                    inputZip.openReadStream(inputZipEntry, (inputZipReadStreamOpenError, inputZipReadStream) => {
                        if (inputZipReadStreamOpenError || !inputZipReadStream) {
                            debug("inputZip openReadStream ERROR", inputZipEntry.fileName, inputZipReadStreamOpenError);

                            pendingOutputZipEntries.delete(inputZipEntry.fileName);

                            streamCallback(inputZipReadStreamOpenError); // forward to outputZip.onError()
                            return;
                        }

                        inputZipReadStream.on("error", function(inputZipReadStreamError) {
                            debug("inputZipReadStream ERROR", inputZipEntry.fileName, inputZipReadStreamError);

                            pendingOutputZipEntries.delete(inputZipEntry.fileName);

                            streamCallback(inputZipReadStreamError); // forward to outputZip.onError()
                        });

                        inputZipReadStream.on("finish", function() {
                            if (DEBUG_VERBOSE) debug("inputZipReadStream FINISH", inputZipEntry.fileName);
                        });
                        inputZipReadStream.on("close", function() {
                            if (DEBUG_VERBOSE) debug("inputZipReadStream CLOSE", inputZipEntry.fileName);
                        });
                        inputZipReadStream.on("end", function() {
                            if (DEBUG_VERBOSE) debug("inputZipReadStream END", inputZipEntry.fileName);

                            pendingOutputZipEntries.delete(inputZipEntry.fileName);

                            if (inputZipReadEntriesDone && pendingOutputZipEntries.size === 0) {
                                process.nextTick(() => {
                                    debug("inputZip emit ENDX ...");
                                    inputZip.emit("endX");
                                });
                            }
                        });

                        if (DEBUG_VERBOSE) debug("streamCallback inputZipReadStream ...", inputZipEntry.fileName);
                        streamCallback(null, inputZipReadStream);
                    });
                });
            }

            // process.nextTick(() => {
            if (DEBUG_VERBOSE) debug("inputZip readEntry() NEXT ...");
            inputZip.readEntry();
            // });
        });

        // process.nextTick(() => {
        if (DEBUG_VERBOSE) debug("inputZip readEntry() FIRST ...");
        inputZip.readEntry();
        // });
    });
}
