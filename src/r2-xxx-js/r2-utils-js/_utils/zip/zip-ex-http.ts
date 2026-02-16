// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as request from "request";
// import * as requestPromise from "request-promise-native";
import { PassThrough } from "stream";
import { URL } from "url";

import { IStreamAndLength, IZip, Zip } from "./zip";

// import { bufferToStream } from "../stream/BufferUtils";

const debug = debug_("r2:utils#zip/zip-ex-http");

export class ZipExplodedHTTP extends Zip {

    public static async loadPromise(urlStr: string): Promise<IZip> {
        return Promise.resolve(new ZipExplodedHTTP(urlStr));
    }

    // private readonly url: URL;

    private constructor(readonly urlStr: string) {
        super();
        debug(`ZipExplodedHTTP: ${urlStr}`);
        // this.url = new URL(urlStr);
    }

    public freeDestroy(): void {
        debug("freeDestroy: ZipExplodedHTTP -- " + this.urlStr);
    }

    public entriesCount(): number {
        return 0; // TODO: hacky! (not really needed ... but still)
    }

    public hasEntries(): boolean {
        return true; // TODO: hacky
    }

    public hasEntry(_entryPath: string): boolean {
        return true;
    }

    public async hasEntryAsync(entryPath: string): Promise<boolean> {

        debug(`hasEntryAsync: ${entryPath}`);

        const url = new URL(this.urlStr);
        // url.pathname += ("/" + entryPath);
        url.pathname += entryPath;
        const urlStrEntry = url.toString();
        debug("urlStrEntry: ", urlStrEntry);

        return new Promise(async (topresolve, _topreject) => {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const failure = async (err: any) => {
                debug(err);
                // topreject(err);
                topresolve(false);
            };

            const success = async (response: request.RequestResponse) => {

                // Object.keys(response.headers).forEach((header: string) => {
                //     debug(header + " => " + response.headers[header]);
                // });

                // debug(response);
                // debug(response.body);

                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    // await failure("HTTP CODE " + response.statusCode);
                    topresolve(false);
                    return;
                }

                topresolve(true);
            };

            // // No response streaming! :(
            // // https://github.com/request/request-promise/issues/90
            // const needsStreamingResponse = true;
            // if (needsStreamingResponse) {
                const promise = new Promise<void>((resolve, reject) => {
                    request.get({
                        headers: {},
                        method: "HEAD",
                        uri: urlStrEntry,
                    })
                        .on("response", async (response: request.RequestResponse) => {
                            try {
                                await success(response);
                            }
                            catch (successError) {
                                await failure(successError);
                                return;
                            }
                            resolve();
                        })
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .on("error", async (err: any) => {
                            await failure(err);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject();
                        });
                });
                try {
                    await promise;
                } catch (_err) {
                    // ignore
                }
            // } else {
            //     let response: requestPromise.FullResponse;
            //     try {
            //         // tslint:disable-next-line:await-promise no-floating-promises
            //         response = await requestPromise({
            //             headers: {},
            //             method: "HEAD",
            //             resolveWithFullResponse: true,
            //             uri: urlStrEntry,
            //         });
            //         await success(response);
            //     } catch (err) {
            //         await failure(err);
            //     }
            // }
        });
    }

    public async getEntries(): Promise<string[]> {

        return new Promise<string[]>(async (_resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject("Not implemented.");
        });
    }

    public async entryStreamPromise(entryPath: string): Promise<IStreamAndLength> {

        debug(`entryStreamPromise: ${entryPath}`);

        // if (!this.hasEntries() || !this.hasEntry(entryPath)) {
        //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        //     return Promise.reject("no such path in zip exploded: " + entryPath);
        // }

        const url = new URL(this.urlStr);
        // url.pathname += ("/" + entryPath);
        url.pathname += entryPath;
        const urlStrEntry = url.toString();
        debug("urlStrEntry: ", urlStrEntry);

        return new Promise(async (topresolve, topreject) => {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const failure = async (err: any) => {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                topreject(err);
            };

            const success = async (response: request.RequestResponse) => {

                // Object.keys(response.headers).forEach((header: string) => {
                //     debug(header + " => " + response.headers[header]);
                // });

                // debug(response);
                // debug(response.body);

                if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                    await failure("HTTP CODE " + response.statusCode);
                    return;
                }

                let length = 0;
                const lengthStr = response.headers["content-length"];
                if (lengthStr) {
                    length = parseInt(lengthStr, 10);
                }

                const stream = new PassThrough();
                response.pipe(stream);

                const streamAndLength: IStreamAndLength = {
                    length,
                    reset: async () => {
                        return this.entryStreamPromise(entryPath);
                    },
                    stream,
                };
                topresolve(streamAndLength);

                // let responseStr: string;
                // if (response.body) {
                //     debug("RES BODY");
                //     responseStr = response.body;
                // } else {
                //     debug("RES STREAM");
                //     let responseData: Buffer;
                //     try {
                //         responseData = await streamToBufferPromise(response);
                //     } catch (err) {
                //         debug(err);
                //         return;
                //     }
                //     responseStr = responseData.toString("utf8");
                // }
            };

            // // No response streaming! :(
            // // https://github.com/request/request-promise/issues/90
            // const needsStreamingResponse = true;
            // if (needsStreamingResponse) {
                const promise = new Promise<void>((resolve, reject) => {
                    request.get({
                        headers: {},
                        method: "GET",
                        uri: urlStrEntry,
                    })
                        .on("response", async (response: request.RequestResponse) => {
                            try {
                                await success(response);
                            }
                            catch (successError) {
                                await failure(successError);
                                return;
                            }
                            resolve();
                        })
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .on("error", async (err: any) => {
                            await failure(err);
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject();
                        });
                });
                try {
                    await promise;
                } catch (_err) {
                    // ignore
                }
            // } else {
            //     let response: requestPromise.FullResponse;
            //     try {
            //         // tslint:disable-next-line:await-promise no-floating-promises
            //         response = await requestPromise({
            //             headers: {},
            //             method: "GET",
            //             resolveWithFullResponse: true,
            //             uri: urlStrEntry,
            //         });
            //         await success(response);
            //     } catch (err) {
            //         await failure(err);
            //     }
            // }
        });
    }
}
