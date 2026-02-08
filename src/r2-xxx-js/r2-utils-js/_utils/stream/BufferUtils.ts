// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BufferReadableStream } from "./BufferReadableStream";

// import { PassThrough } from "stream";

export function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {

    return new BufferReadableStream(buffer);

    // const stream = new PassThrough();

    // setTimeout(() => {

    //     // stream.write(buffer);
    //     // stream.end();

    //     // const maxBuffLength = 2048; // 2kB
    //     let maxBuffLength = 100 * 1024; // 100kB

    //     let buff = buffer;
    //     let remaining = buff.length;
    //     let done = 0;

    //     console.log("bufferToStream()  BEFORE: " + remaining);

    //     while (remaining > 0) {

    //         if (done > 0) {
    //             buff = buffer.slice(done);
    //             // remaining === buff.length
    //         }

    //         if (buff.length > maxBuffLength) {
    //             buff = buff.slice(0, maxBuffLength);
    //         }

    //         const res = stream.write(buff);
    //         if (!res) {
    //             console.log("bufferToStream()  highWaterMark");

    //             // Buffer highWaterMark CHECK
    //             if ((stream as any)._writableState) {
    //                 const internalStreamWriteBuffer = (stream as any)._writableState.getBuffer();
    //                 if (internalStreamWriteBuffer) {
    //                     console.log("bufferToStream() _writableState.getBuffer().length: "
    // + internalStreamWriteBuffer.length);
    //                 }
    //             }

    //             // Buffer highWaterMark CHECK
    //             if ((stream as any)._readableState) {
    //                 const internalStreamReadBuffer = (stream as any)._readableState.buffer;
    //                 if (internalStreamReadBuffer) {
    //                     console.log("bufferToStream() _readableState.buffer.length: "
    // + internalStreamReadBuffer.length);
    //                 }
    //             }

    //         }

    //         done += buff.length;
    //         remaining -= buff.length;
    //     }

    //     console.log("bufferToStream()  AFTER: " + done);

    //     stream.end();
    // }, 20);

    // return stream;
}

export async function streamToBufferPromise_READABLE(readStream: NodeJS.ReadableStream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const buffers: Buffer[] = [];

        const cleanup = () => {
            readStream.removeListener("readable", handleReadable);
            readStream.removeListener("error", handleError);
            // readStream.removeListener("end", handleEnd);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleError = (e: any) => {
            console.log(e);
            cleanup();
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(e);
        };
        readStream.on("error", handleError);

        const handleReadable = () => {
            let chunk: Buffer;
            do {
                chunk = readStream.read() as Buffer;
                if (chunk) {
                    buffers.push(chunk);
                }
            }
            while (chunk);

            finish();
        };
        readStream.on("readable", handleReadable);

        let finished = false;
        const finish = () => {
            if (finished) {
                return;
            }
            finished = true;

            cleanup();
            resolve(Buffer.concat(buffers));
        };

        // // With NodeJS v8, this event is raised. Not with NodeJS 10+
        // const handleEnd = () => {
        //     finish();
        // };
        // readStream.on("end", finish);
    });
}

export async function streamToBufferPromise(readStream: NodeJS.ReadableStream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const buffers: Buffer[] = [];

        const cleanup = () => {
            readStream.removeListener("data", handleData);
            readStream.removeListener("error", handleError);
            readStream.removeListener("end", handleEnd);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleError = (e: any) => {
            console.log(e);
            cleanup();
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(e);
        };
        readStream.on("error", handleError);

        const handleData = (data: Buffer) => {
            buffers.push(data);
        };
        readStream.on("data", handleData);

        const handleEnd = () => {
            cleanup();
            resolve(Buffer.concat(buffers));
        };
        readStream.on("end", handleEnd);
    });
}
