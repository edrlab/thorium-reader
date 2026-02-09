// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as request from "request";
// import * as requestPromise from "request-promise-native";
import * as yauzl from "yauzl";

import { isHTTP } from "../http/UrlUtils";
import { streamToBufferPromise } from "../stream/BufferUtils";
import { IStreamAndLength, IZip, Zip } from "./zip";
import { HttpZipReader } from "./zip2RandomAccessReader_Http";

const debug = debug_("r2:utils#zip/zip2");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IStringKeyedObject { [key: string]: any; }

export class Zip2 extends Zip {

    public static async loadPromise(filePath: string): Promise<IZip> {
        if (isHTTP(filePath)) {
            return Zip2.loadPromiseHTTP(filePath);
        }

        return new Promise<IZip>((resolve, reject) => {

            yauzl.open(filePath, { lazyEntries: true, autoClose: false }, (err, zip) => {
                if (err || !zip) {
                    debug("yauzl init ERROR");
                    debug(err);
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(err);
                    return;
                }
                const zip2 = new Zip2(filePath, zip);

                zip.on("error", (erro) => {
                    debug("yauzl ERROR");
                    debug(erro);
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(erro);
                });

                zip.readEntry(); // next (lazyEntries)
                zip.on("entry", (entry) => {
                    // if (/\/$/.test(entry.fileName)) {
                    if (entry.fileName[entry.fileName.length - 1] === "/") {
                        // skip directories / folders
                    } else {
                        // debug(entry.fileName);
                        zip2.addEntry(entry);
                    }
                    zip.readEntry(); // next (lazyEntries)
                });

                zip.on("end", () => {
                    debug("yauzl END");
                    resolve(zip2);
                });

                zip.on("close", () => {
                    debug("yauzl CLOSE");
                });
            });
        });
    }

    private static async loadPromiseHTTP(filePath: string): Promise<IZip> {

        // // No response streaming! :(
        // // https://github.com/request/request-promise/issues/90
        // const needsStreamingResponse = true;

        return new Promise<IZip>(async (resolve, reject) => {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const failure = (err: any) => {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(err);
            };

            const success = async (res: request.RequestResponse) => {
                if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                    failure("HTTP CODE " + res.statusCode);
                    return;
                }

                debug(filePath);
                debug(res.headers);

                // if (!res.headers["content-type"]
                //     || res.headers["content-type"] !== "application/epub+zip") {
                //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                //     reject("content-type not supported!");
                //     return;
                // }

                // TODO: if the HTTP server does not provide Content-Length,
                // then fallback on download, but interrupt (req.abort())
                // if response payload reaches the max limit
                if (!res.headers["content-length"]) {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject("content-length not supported!");
                    return;
                }
                const httpZipByteLength = parseInt(res.headers["content-length"] as string, 10);
                debug(`Content-Length: ${httpZipByteLength}`);

                if (!res.headers["accept-ranges"]
                    // Note: some servers have several headers with the same value!
                    // (erm, https://raw.githubusercontent.com)
                    // (comma-separated values, so we can't match "bytes" exactly)
                    || res.headers["accept-ranges"].indexOf("bytes") < 0) {

                    if (httpZipByteLength > (2 * 1024 * 1024)) {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject("accept-ranges not supported, file too big to download: " + httpZipByteLength);
                        return;
                    }
                    debug("Downloading: " + filePath);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const failure_ = (err: any) => {

                        debug(err);
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(err);
                    };

                    const success_ = async (ress: request.RequestResponse) => {
                        if (ress.statusCode && (ress.statusCode < 200 || ress.statusCode >= 300)) {
                            failure_("HTTP CODE " + ress.statusCode);
                            return;
                        }

                        // debug(filePath);
                        // debug(res.headers);
                        let buffer: Buffer;
                        try {
                            buffer = await streamToBufferPromise(ress);
                        } catch (err) {
                            debug(err);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(err);
                            return;
                        }

                        yauzl.fromBuffer(buffer,
                            { lazyEntries: true },
                            (err, zip) => {
                                if (err || !zip) {
                                    debug("yauzl init ERROR");
                                    debug(err);
                                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                                    reject(err);
                                    return;
                                }
                                const zip2 = new Zip2(filePath, zip);

                                zip.on("error", (erro) => {
                                    debug("yauzl ERROR");
                                    debug(erro);
                                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                                    reject(erro);
                                });

                                zip.readEntry(); // next (lazyEntries)
                                zip.on("entry", (entry) => {
                                    if (entry.fileName[entry.fileName.length - 1] === "/") {
                                        // skip directories / folders
                                    } else {
                                        // debug(entry.fileName);
                                        zip2.addEntry(entry);
                                    }
                                    zip.readEntry(); // next (lazyEntries)
                                });

                                zip.on("end", () => {
                                    debug("yauzl END");
                                    resolve(zip2);
                                });

                                zip.on("close", () => {
                                    debug("yauzl CLOSE");
                                });
                            });
                    };

                    // if (needsStreamingResponse) {
                        request.get({
                            headers: {},
                            method: "GET",
                            uri: filePath,
                        })
                            .on("response", async (res) => {
                                try {
                                    await success_(res);
                                }
                                catch (successError) {
                                    failure_(successError);
                                    return;
                                }
                            })
                            .on("error", failure_);
                    // } else {
                    //     let ress: requestPromise.FullResponse;
                    //     try {
                    //         // tslint:disable-next-line:await-promise no-floating-promises
                    //         ress = await requestPromise({
                    //             headers: {},
                    //             method: "GET",
                    //             resolveWithFullResponse: true,
                    //             uri: filePath,
                    //         });
                    //     } catch (err) {
                    //         failure_(err);
                    //         return;
                    //     }

                    //     await success_(ress);
                    // }

                    return;
                }

                const httpZipReader = new HttpZipReader(filePath, httpZipByteLength);
                yauzl.fromRandomAccessReader(httpZipReader, httpZipByteLength,
                    { lazyEntries: true, autoClose: false },
                    (err, zip) => {
                        if (err || !zip) {
                            debug("yauzl init ERROR");
                            debug(err);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(err);
                            return;
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (zip as any).httpZipReader = httpZipReader;
                        const zip2 = new Zip2(filePath, zip);

                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        zip.on("error", (erro: any) => {
                            debug("yauzl ERROR");
                            debug(erro);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(erro);
                        });

                        zip.readEntry(); // next (lazyEntries)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        zip.on("entry", (entry: any) => {
                            if (entry.fileName[entry.fileName.length - 1] === "/") {
                                // skip directories / folders
                            } else {
                                // debug(entry.fileName);
                                zip2.addEntry(entry);
                            }
                            zip.readEntry(); // next (lazyEntries)
                        });

                        zip.on("end", () => {
                            debug("yauzl END");
                            resolve(zip2);
                        });

                        zip.on("close", () => {
                            debug("yauzl CLOSE");
                        });
                    });
            };

            // if (needsStreamingResponse) {
                request.get({
                    headers: {},
                    method: "HEAD",
                    uri: filePath,
                })
                    .on("response", async (res) => {
                        try {
                            await success(res);
                        }
                        catch (successError) {
                            failure(successError);
                            return;
                        }
                    })
                    .on("error", failure);
            // } else {
            //     // TODO: instead of a HEAD request, if not supported then
            //     // GET with immediate req.abort() in the response callback
            //     let res: requestPromise.FullResponse;
            //     try {
            //         // tslint:disable-next-line:await-promise no-floating-promises
            //         res = await requestPromise({
            //             headers: {},
            //             method: "HEAD",
            //             resolveWithFullResponse: true,
            //             uri: filePath,
            //         });
            //     } catch (err) {
            //         failure(err);
            //         return;
            //     }

            //     await success(res);
            // }
        });
    }

    private entries: IStringKeyedObject;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private constructor(readonly filePath: string, readonly zip: any) {
        super();

        // see addEntry()
        this.entries = {};
    }

    public freeDestroy(): void {
        debug("freeDestroy: Zip2 -- " + this.filePath);
        if (this.zip) {
            this.zip.close();
        }
    }

    public entriesCount(): number {
        return this.zip.entryCount;
    }

    public hasEntries(): boolean {
        return this.entriesCount() > 0;
    }

    public hasEntry(entryPath: string): boolean {
        return this.hasEntries() && this.entries[entryPath];
    }

    public async getEntries(): Promise<string[]> {

        if (!this.hasEntries()) {
            return Promise.resolve([]);
        }
        return Promise.resolve(Object.keys(this.entries));
    }

    public async entryStreamPromise(entryPath: string): Promise<IStreamAndLength> {

        // debug(`entryStreamPromise: ${entryPath}`);

        if (!this.hasEntries() || !this.hasEntry(entryPath)) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("no such path in zip: " + entryPath);
        }

        const entry = this.entries[entryPath];

        return new Promise<IStreamAndLength>((resolve, reject) => {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.zip.openReadStream(entry, (err: any, stream: NodeJS.ReadableStream) => {
                if (err) {
                    debug("yauzl openReadStream ERROR");
                    debug(err);
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(err);
                    return;
                }
                const streamAndLength: IStreamAndLength = {
                    length: entry.uncompressedSize as number,
                    reset: async () => {
                        return this.entryStreamPromise(entryPath);
                    },
                    stream,
                };
                resolve(streamAndLength);
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private addEntry(entry: any) {
        this.entries[entry.fileName] = entry;
    }
}
