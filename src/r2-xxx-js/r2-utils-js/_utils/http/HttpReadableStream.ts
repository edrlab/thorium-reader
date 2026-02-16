// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as request from "request";
// import * as requestPromise from "request-promise-native";
import { Readable } from "stream";

import { streamToBufferPromise } from "../stream/BufferUtils";

/////////////
/////////////
/////////////
///////////// THIS IS UNUSED CODE!
/////////////
/////////////
/////////////

const debug = debug_("r2:utils#http/HttpReadableStream");

export class HttpReadableStream extends Readable {

    private alreadyRead = 0;

    constructor(
        readonly url: string,
        readonly byteLength: number,
        readonly byteStart: number,
        readonly byteEnd: number) {
        super();
    }

    public _read(_size: number) {

        const length = this.byteEnd - this.byteStart;
        // debug(`_read: ${size} (${this.url}` +
        //     ` content-length=${this.byteLength} start=${this.start} end+1=${this.end} (length=${length}))`);
        // debug(`alreadyRead: ${this.alreadyRead} (byteLength: ${length})`);
        if (this.alreadyRead >= length) {
            // debug("this.alreadyRead >= this.byteLength");
            this.push(null);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const failure = (err: any) => {
            debug(err);
            this.push(null);
        };

        const success = async (res: request.RequestResponse) => {
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                failure("HTTP CODE " + res.statusCode);
                return;
            }

            // debug(res.headers);
            // debug(res.headers["content-type"]);
            // debug(`HTTP response content-range: ${res.headers["content-range"]}`);
            // debug(`HTTP response content-length: ${res.headers["content-length"]}`);

            let buffer: Buffer;
            try {
                buffer = await streamToBufferPromise(res);
            } catch (err) {
                failure(err);
                return;
            }

            // debug(`streamToBufferPromise: ${buffer.length}`);
            this.alreadyRead += buffer.length;
            this.push(buffer);
        };

        debug(`HTTP GET ${this.url}: ${this.byteStart}-${this.byteEnd} (${this.byteEnd - this.byteStart})`);

        const lastByteIndex = this.byteEnd - 1;
        const range = `${this.byteStart}-${lastByteIndex}`;

        // // No response streaming! :(
        // // https://github.com/request/request-promise/issues/90
        // const needsStreamingResponse = true;
        // if (needsStreamingResponse) {
            request.get({
                headers: { Range: `bytes=${range}` },
                method: "GET",
                uri: this.url,
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
        //     (async () => {
        //         let res: requestPromise.FullResponse;
        //         try {
        //             // tslint:disable-next-line:await-promise no-floating-promises
        //             res = await requestPromise({
        //                 headers: { Range: `bytes=${range}` },
        //                 method: "GET",
        //                 resolveWithFullResponse: true,
        //                 uri: this.url,
        //             });
        //         } catch (err) {
        //             failure(err);
        //             return;
        //         }

        //         await success(res);
        //     })();
        // }
    }
}
