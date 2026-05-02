// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import debug_ from "debug";
import * as zlib from "zlib";

import { Encrypted } from "@r2-lcp-js/models/metadata-encrypted";
import { IDecryptedBuffer, LCP } from "@r2-lcp-js/parser/epub/lcp";
import { bufferToStream, streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { RangeStream } from "@r2-utils-js/_utils/stream/RangeStream";
import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";

// import * as forge from "node-forge";
// import { CounterPassThroughStream } from "@r2-utils-js/_utils/stream/CounterPassThroughStream";
import { Transform } from "stream";

const debug = debug_("r2:lcp#transform/transformer-lcp");

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const AES_BLOCK_SIZE = 16;

// let streamCounter = 0;

const readStream = async (s: NodeJS.ReadableStream, n: number): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        // s.pause();
        const onReadable = () => {
            // debug("readStream READABLE");
            const b = s.read(n);
            s.removeListener("readable", onReadable);
            s.removeListener("error", reject);
            // s.resume();
            resolve(b as Buffer);
        };
        s.on("readable", onReadable);
        s.on("error", reject);
        // s.on("end", () => {
        //     debug("readStream END");
        // });
        // s.on("drain", () => {
        //     debug("readStream DRAIN");
        // });
        // s.on("finish", () => {
        //     debug("readStream FINISH");
        // });
    });
};

export interface ICryptoInfo {
    length: number;
    padding: number;
}

export function supports(
    lcp: LCP,
    _linkHref: string,
    linkPropertiesEncrypted: Encrypted): boolean {

    if (!lcp) {
        return false;
    }
    if (!linkPropertiesEncrypted) {
        return false;
    }

    if (!lcp.isReady()) {
        debug("LCP not ready!");
        return false;
    }

    // TODO: check that the native lib supports the LCP profiles (basic or 1.0 or 2.x)
    // getListOfSupportedProfileURIs()
    const check =
        linkPropertiesEncrypted.Algorithm === "http://www.w3.org/2001/04/xmlenc#aes256-cbc"
        &&
        (
            (
            linkPropertiesEncrypted.Scheme === "http://readium.org/2014/01/lcp"
            &&
            (
            linkPropertiesEncrypted.Profile === "http://readium.org/lcp/basic-profile"
            ||
            linkPropertiesEncrypted.Profile === "http://readium.org/lcp/profile-1.0"
            ||
            (linkPropertiesEncrypted.Profile && /^http:\/\/readium\.org\/lcp\/profile-2\.[0-9]$/.test(linkPropertiesEncrypted.Profile))
            )
            )

        ||

            // the above test is an exact match for each information field in manifest.json,
            // but this is very verbose and unnecessarily repetitive in "Readium Web Pub Manifest"
            // so a future version of RWPM might not provide all these fields.
            // Below is a simpler test based on the fact that:
            // linkPropertiesEncrypted indicates that the resource is encrypted with AES-256-CBC,
            // but it could be non-LCP obfuscation (e.g. IDPF or Adobe URIs) or a non-LCP DRM,
            // so we must check the supported LCP profiles (basic or 1.0 or 2.x)
            (
            lcp.Encryption.Profile === "http://readium.org/lcp/basic-profile"
            ||
            lcp.Encryption.Profile === "http://readium.org/lcp/profile-1.0"
            ||
            (lcp.Encryption.Profile && /^http:\/\/readium\.org\/lcp\/profile-2\.[0-9]$/.test(lcp.Encryption.Profile))
            )
        )
    ;

    if (!check) {
        // if (IS_DEV) {
        //     debug("Incorrect resource LCP fields (obfuscated fonts?).");
        //     debug(linkPropertiesEncrypted.Scheme);
        //     debug(linkPropertiesEncrypted.Profile);
        //     debug(linkPropertiesEncrypted.Algorithm);
        //     debug(lcp.Encryption.Profile);
        // }
        return false;
    }

    return true;
}

class CryptoStream extends Transform { // Readable
    public readonly lcp: LCP;
    public readonly linkHref: string;
    public readonly linkPropertiesEncrypted: Encrypted;
    public readonly stream: IStreamAndLength;
    public readonly isPartialByteRangeRequest: boolean;
    public readonly partialByteBegin: number;
    public readonly partialByteEnd: number;

    private bytesReceived: number;
    private finished: boolean;
    private isClosed: boolean;
    private bufferAccu: Array<Buffer>;
    private bufferAccuLength: number;
    private iv: Buffer | undefined;

    constructor(
        lcp: LCP,
        linkHref: string,
        linkPropertiesEncrypted: Encrypted,
        stream: IStreamAndLength,
        isPartialByteRangeRequest: boolean,
        partialByteBegin: number,
        partialByteEnd: number) {

        super();

        this.lcp = lcp;
        this.linkHref = linkHref;
        this.linkPropertiesEncrypted = linkPropertiesEncrypted;
        this.stream = stream;
        this.isPartialByteRangeRequest = isPartialByteRangeRequest;
        this.partialByteBegin = partialByteBegin;
        this.partialByteEnd = partialByteEnd;

        this.bytesReceived = 0;
        this.finished = false;
        this.isClosed = false;
        this.bufferAccu = [];
        this.bufferAccuLength = 0;
        this.iv = undefined;
    }

    public _flush(callback: () => void): void {
        // debug("FLUSH");
        callback();
    }

    public _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
        this.bytesReceived += chunk.length;
        // debug(`_transform bytesReceived ${this.bytesReceived} (+ ${chunk.length})`);
        this.bufferAccuLength += chunk.length;
        this.bufferAccu.push(chunk);

        // debug("stream.length: " + this.stream.length);
        // debug("readableHighWaterMark: " + this.readableHighWaterMark);
        // debug("writableHighWaterMark: " + this.writableHighWaterMark);

        if (this.finished) {
            if (!this.isClosed) {
                debug("CryptoStream _transform ???? CLOSING...");
                this.isClosed = true;
                this.push(null);
            } else {
                debug("CryptoStream _transform ???? STILL PIPE CALLING _transform ??!");
                this.end();
            }
            callback();
        } else {
            const TWO_AES_BLOCK_SIZE = 2 * AES_BLOCK_SIZE;

            const streamRemainder = this.stream.length - this.bytesReceived;

            const canDecrypt = this.bufferAccuLength >= TWO_AES_BLOCK_SIZE;

            const blockAlignRemainder = this.bufferAccuLength % AES_BLOCK_SIZE;

            const shouldDecryptAndPush = canDecrypt
                && (this.bufferAccuLength >= this.writableHighWaterMark || streamRemainder <= 0)
                && (streamRemainder <= 0 || (streamRemainder + blockAlignRemainder) >= TWO_AES_BLOCK_SIZE);

            if (!shouldDecryptAndPush) {
                if (streamRemainder <= 0) {
                    debug("CryptoStream _transform ???? streamRemainder <= 0", this.bytesReceived, this.stream.length, this.bufferAccuLength);
                    this.finished = true;
                    this.isClosed = true;
                    this.push(null);
                    this.end();
                }
                callback();
            } else {
                // if (blockAlignRemainder > 0) debug("DECRYPT", this.bytesReceived, this.stream.length, this.bufferAccuLength, blockAlignRemainder);
                let bufferToDecrypt = Buffer.concat(this.bufferAccu);
                this.bufferAccu = [];
                this.bufferAccuLength = 0;
                if (blockAlignRemainder > 0) { // need to preserve the block-aligned remainder for the next iteration
                    const lengthBlockAligned = bufferToDecrypt.length - blockAlignRemainder;
                    const remainderbuff = bufferToDecrypt.slice(lengthBlockAligned); // , bufferAccu.length
                    this.bufferAccuLength = remainderbuff.length;
                    this.bufferAccu.push(remainderbuff);
                    bufferToDecrypt = bufferToDecrypt.slice(0, lengthBlockAligned);
                }
                const ivForNext = bufferToDecrypt.slice(bufferToDecrypt.length - AES_BLOCK_SIZE);
                const buff = this.iv ? Buffer.concat([this.iv, bufferToDecrypt]) : bufferToDecrypt;
                this.iv = ivForNext;

                this.lcp.decrypt(buff /*, this.linkHref, isCompressionDeflate */).then((res) => {
                    let nativelyDecryptedBuffer = res.buffer;
                    if (streamRemainder <= 0) {
                        const padding = nativelyDecryptedBuffer[nativelyDecryptedBuffer.length - 1];
                        // debug("END padding: " + padding);
                        // const buff = Buffer.from(
                        //     nativelyDecryptedBuffer,
                        //     0,
                        //     nativelyDecryptedBuffer.length - padding);
                        nativelyDecryptedBuffer = nativelyDecryptedBuffer.slice(0, nativelyDecryptedBuffer.length - padding);
                    }

                    this.push(nativelyDecryptedBuffer);

                    if (streamRemainder <= 0) {
                        // debug("DONE streamRemainder <= 0", this.bytesReceived, this.stream.length, this.bufferAccuLength);
                        this.finished = true;
                        this.isClosed = true;
                        this.push(null);
                        this.end();
                    }
                    callback();
                }).catch((err) => {
                    debug("CryptoStream _transform");
                    debug(err);
                    this.finished = true;
                    this.isClosed = true;
                    this.push(null);
                    this.end();
                    callback();
                });
            }
        }
    }
}

const USE_LAZY_LCP_READ_STREAM = true;

export async function transformStream(
    lcp: LCP,
    linkHref: string,
    linkPropertiesEncrypted: Encrypted,
    stream: IStreamAndLength,
    isPartialByteRangeRequest: boolean,
    partialByteBegin: number,
    partialByteEnd: number): Promise<IStreamAndLength> {

    const isCompressionNone = linkPropertiesEncrypted.Compression === "none" || !linkPropertiesEncrypted.Compression;
    const isCompressionDeflate = linkPropertiesEncrypted.Compression === "deflate";

    let plainTextSize = -1;

    let nativelyDecryptedStream: NodeJS.ReadableStream | undefined;
    // let nativelyInflated = false;
    if (lcp.isNativeNodePlugin()) {

        if (IS_DEV) {
            debug("LCP DECRYPT NATIVE: " + linkHref);
        }

        if (USE_LAZY_LCP_READ_STREAM) {
            // nativelyInflated = false;
            if (linkPropertiesEncrypted.DecryptedLengthBeforeInflate > 0) {
                plainTextSize = linkPropertiesEncrypted.DecryptedLengthBeforeInflate;
            } else {
                if (linkPropertiesEncrypted.OriginalLength > 0) {
                    plainTextSize = linkPropertiesEncrypted.OriginalLength;
                } else {
                    if (IS_DEV) {
                        debug("NEED PADDING LOOKUP...");
                    }
                    if (isCompressionDeflate) {
                        debug("isCompressionDeflate but no OriginalLength!");
                    }
                    plainTextSize = stream.length - AES_BLOCK_SIZE; // minus padding! [0,AES_BLOCK_SIZE]

                    const TWO_AES_BLOCK_SIZE = 2 * AES_BLOCK_SIZE;

                    const rangePadding = new RangeStream(stream.length - TWO_AES_BLOCK_SIZE, stream.length - 1, stream.length);
                    stream.stream.pipe(rangePadding);

                    try {
                        const buf = await readStream(rangePadding, TWO_AES_BLOCK_SIZE);
                        if (!buf) {
                            debug("!buf (end?)");
                            return Promise.reject("!buf (end?)");
                        } else {
                            if (buf.length !== TWO_AES_BLOCK_SIZE) {
                                debug("buf.length !== TWO_AES_BLOCK_SIZE");
                                return Promise.reject("buf.length !== TWO_AES_BLOCK_SIZE");
                            } else {
                                try {
                                    const res = await lcp.decrypt(buf /*, this.linkHref, isCompressionDeflate */);
                                    const nativelyDecryptedBuffer = res.buffer;
                                    const padding = nativelyDecryptedBuffer[nativelyDecryptedBuffer.length - 1];
                                    if (IS_DEV) {
                                        debug("padding ok: " + padding);
                                    }
                                    plainTextSize = stream.length - AES_BLOCK_SIZE - padding;
                                    linkPropertiesEncrypted.CypherBlockPadding = padding;
                                } catch (err) {
                                    debug(err);
                                    return Promise.reject(err);
                                }

                            }
                        }
                    } catch (err) {
                        debug(err);
                        return Promise.reject(err);
                    }

                    try {
                        stream = await stream.reset();
                    } catch (err) {
                        debug(err);
                        return Promise.reject(err);
                    }
                }
                linkPropertiesEncrypted.DecryptedLengthBeforeInflate = plainTextSize;
            }
            const cryptoStream = new CryptoStream(lcp, linkHref, linkPropertiesEncrypted, stream, isPartialByteRangeRequest, partialByteBegin, partialByteEnd);
            stream.stream.pipe(cryptoStream);
            nativelyDecryptedStream = cryptoStream;
        } else {

        // !USE_LAZY_LCP_READ_STREAM
        let fullEncryptedBuffer: Buffer;
        try {
            fullEncryptedBuffer = await streamToBufferPromise(stream.stream);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("OUCH!");
        }

        // debug("stream.length: " + stream.length);
        // debug("fullEncryptedBuffer.length: " + fullEncryptedBuffer.length);

        // debug(fullEncryptedBuffer.slice(0, 32));

        // debug(fullEncryptedBuffer.slice(fullEncryptedBuffer.length - 32));

        let res: IDecryptedBuffer;
        try {
            res = await lcp.decrypt(fullEncryptedBuffer /*, linkHref, isCompressionDeflate */);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("OUCH!");
        }

        let nativelyDecryptedBuffer = res.buffer;
        const padding = nativelyDecryptedBuffer[nativelyDecryptedBuffer.length - 1];
        // debug("padding: " + padding);
        // const buff = Buffer.from(
        //     nativelyDecryptedBuffer,
        //     0,
        //     nativelyDecryptedBuffer.length - padding);
        nativelyDecryptedBuffer = nativelyDecryptedBuffer.slice(0, nativelyDecryptedBuffer.length - padding);

        // nativelyInflated = res.inflated; // always false
        // debug("nativelyInflated: " + nativelyInflated);

        // debug(nativelyDecryptedBuffer.length);

        plainTextSize = nativelyDecryptedBuffer.length;
        linkPropertiesEncrypted.DecryptedLengthBeforeInflate = plainTextSize;
        linkPropertiesEncrypted.CypherBlockPadding = padding;

        // debug("nativelyDecryptedBuffer.length: " + nativelyDecryptedBuffer.length);
        // debug("linkPropertiesEncrypted.OriginalLength: " + linkPropertiesEncrypted.OriginalLength);
        // debug("linkPropertiesEncrypted.Compression : " + linkPropertiesEncrypted.Compression );


        if (//!nativelyInflated && // necessary, even if isCompressionNone! (LCP inflation byte variance)
            linkPropertiesEncrypted.OriginalLength &&
            isCompressionNone &&
            linkPropertiesEncrypted.OriginalLength !== plainTextSize) {

            debug("############### LCP transformStream() LENGTH NOT MATCH linkPropertiesEncrypted.OriginalLength !== plainTextSize: " +
                `${linkPropertiesEncrypted.OriginalLength} !== ${plainTextSize}`);
        }

        nativelyDecryptedStream = bufferToStream(nativelyDecryptedBuffer);
        // !USE_LAZY_LCP_READ_STREAM
        }
    } else {
        let cryptoInfo: ICryptoInfo | undefined;
        let cypherBlockPadding = -1;
        if (linkPropertiesEncrypted.DecryptedLengthBeforeInflate > 0) {
            plainTextSize = linkPropertiesEncrypted.DecryptedLengthBeforeInflate;
            cypherBlockPadding = linkPropertiesEncrypted.CypherBlockPadding;
        } else {
            // const timeBegin = process.hrtime();
            try {
                cryptoInfo = await getDecryptedSizeStream(lcp, stream);
            } catch (err) {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(err);
            }
            plainTextSize = cryptoInfo.length;
            cypherBlockPadding = cryptoInfo.padding;

            // length cached to avoid resetting the stream to zero-position
            linkPropertiesEncrypted.DecryptedLengthBeforeInflate = plainTextSize;
            linkPropertiesEncrypted.CypherBlockPadding = cypherBlockPadding;

            try {
                stream = await stream.reset();
            } catch (err) {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(err);
            }

            // const timeElapsed = process.hrtime(timeBegin);
            // debug(`LCP transformStream() ---- getDecryptedSizeStream():` +
            //     `${timeElapsed[0]} seconds + ${timeElapsed[1]} nanoseconds`);

            // debug("LCP transformStream() ---- getDecryptedSizeStream(): " + plainTextSize);

            if (linkPropertiesEncrypted.OriginalLength &&
                isCompressionNone &&
                linkPropertiesEncrypted.OriginalLength !== plainTextSize) {

                debug("############### LCP transformStream() LENGTH NOT MATCH linkPropertiesEncrypted.OriginalLength !== plainTextSize: " +
                    `${linkPropertiesEncrypted.OriginalLength} !== ${plainTextSize}`);
            }
        }
    }

    let destStream: NodeJS.ReadableStream;
    if (nativelyDecryptedStream) {
        destStream = nativelyDecryptedStream;
    } else {
        // const partialByteLength = (partialByteEnd + 1) - partialByteBegin;

        let rawDecryptStream: NodeJS.ReadableStream | undefined;

        let ivBuffer: Buffer | undefined;
        if (linkPropertiesEncrypted.CypherBlockIV) {
            ivBuffer = Buffer.from(linkPropertiesEncrypted.CypherBlockIV, "binary");

            const cypherRangeStream = new RangeStream(AES_BLOCK_SIZE, stream.length - 1, stream.length);
            stream.stream.pipe(cypherRangeStream);
            rawDecryptStream = cypherRangeStream;
        } else {
            // const ivRangeStream = new RangeStream(0, AES_BLOCK_SIZE - 1, stream.length);
            // stream.stream.pipe(ivRangeStream);
            // try {
            //     ivBuffer = await streamToBufferPromise(ivRangeStream);
            // } catch (err) {
            //     debug(err);
            //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            //     return Promise.reject("OUCH!");
            // }
            // try {
            //     stream = await stream.reset();
            // } catch (err) {
            //     debug(err);
            //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            //     return Promise.reject(err);
            // }

            // debug("D1");
            // debug(ivBuffer.length);
            // debug(ivBuffer.toString("hex"));

            // ivBuffer = stream.stream.read(AES_BLOCK_SIZE) as Buffer;

            try {
                ivBuffer = await readStream(stream.stream, AES_BLOCK_SIZE);
            } catch (err) {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(err);
            }

            // debug("D2");
            // debug(ivBuffer.length);
            // debug(ivBuffer.toString("hex"));
            // b06ca4cec8831eb158f1a317503f5101
            // === asharedculture_soundtrack.mp3
            //
            // 07e6870e5d708f39e98316b5c0a574c5
            // === shared-culture.mp4

            linkPropertiesEncrypted.CypherBlockIV = ivBuffer.toString("binary");

            stream.stream.resume();
            rawDecryptStream = stream.stream;
        }
        // debug("IV: " + forge.util.bytesToHex(ivBuffer));

        // debug(forge.util.bytesToHex(contentKey as string));

        // https://github.com/nodejs/node/blob/master/lib/crypto.js#L259
        const decryptStream = crypto.createDecipheriv("aes-256-cbc",
            // Note: assumes lcp.ContentKey has been set (can be undefined)
            // (this is only for testing the pure JS implementation anyway)
            lcp.ContentKey as Buffer, // Buffer.from(contentKey as string, "binary"),
            ivBuffer);
        decryptStream.setAutoPadding(false);
        rawDecryptStream.pipe(decryptStream);

        destStream = decryptStream;

        if (linkPropertiesEncrypted.CypherBlockPadding) {
            // debugx("cryptoInfo.padding: " + cypherBlockPadding);
            const cypherUnpaddedStream = new RangeStream(0, plainTextSize - 1, plainTextSize);
            destStream.pipe(cypherUnpaddedStream);
            destStream = cypherUnpaddedStream;
        }

        // const counterStream2 = new CounterPassThroughStream(++streamCounter);
        // destStream.pipe(counterStream2)
        //     .on("progress", function f() {
        //         // debug("Crypto PROGRESS: " +
        //         //     (this as CounterPassThroughStream).id +
        //         //     " -- " + (this as CounterPassThroughStream).bytesReceived);
        //     })
        //     .on("end", function f() {
        //         debug("Crypto END: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("close", function f() {
        //         debug("Crypto CLOSE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .once("finish", function f() {
        //         debug("Crypto FINISH: " +
        //             (this as CounterPassThroughStream).id +
        //             " -- " + (this as CounterPassThroughStream).bytesReceived);

        //         if (plainTextSize !==
        //             (this as CounterPassThroughStream).bytesReceived) {

        //             debug(`############### ` +
        //                 `LCP Crypto LENGTH NOT MATCH ` +
        //                 `plainTextSize !== bytesReceived:` +
        //                 `${plainTextSize} !== ` +
        //                 `${(this as CounterPassThroughStream).bytesReceived}`);
        //         }
        //     })
        //     .on("error", function f() {
        //         debug("CounterPassThroughStream ERROR: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("pipe", function f() {
        //         debug("CounterPassThroughStream PIPE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("unpipe", function f() {
        //         debug("CounterPassThroughStream UNPIPE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("drain", function f() {
        //         // debug("CounterPassThroughStream DRAIN: " +
        //         //     (this as CounterPassThroughStream).id);
        //     });
        // destStream = counterStream2;
    }

    if (// !nativelyInflated &&
        isCompressionDeflate) {

        // https://github.com/nodejs/node/blob/master/lib/zlib.js
        const inflateStream = zlib.createInflateRaw();
        destStream.pipe(inflateStream);
        destStream = inflateStream;

        if (!linkPropertiesEncrypted.OriginalLength) {
            debug("############### RESOURCE ENCRYPTED OVER DEFLATE, BUT NO OriginalLength!");

            let fullDeflatedBuffer: Buffer;
            try {
                fullDeflatedBuffer = await streamToBufferPromise(destStream);
                linkPropertiesEncrypted.OriginalLength = fullDeflatedBuffer.length;
                destStream = bufferToStream(fullDeflatedBuffer);
            } catch (err) {
                debug(err);
            }
        }

        // const counterStream = new CounterPassThroughStream(++streamCounter);
        // inflateStream.pipe(counterStream)
        //     .on("progress", function f() {
        //         // debug("CounterPassThroughStream PROGRESS: " +
        //         //     (this as CounterPassThroughStream).id +
        //         //     " -- " + (this as CounterPassThroughStream).bytesReceived);
        //     })
        //     .on("end", function f() {
        //         debug("CounterPassThroughStream END: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("close", function f() {
        //         debug("CounterPassThroughStream CLOSE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .once("finish", function f() {
        //         debug("CounterPassThroughStream FINISH: " +
        //             (this as CounterPassThroughStream).id +
        //             " -- " + (this as CounterPassThroughStream).bytesReceived);

        //         if (linkPropertiesEncrypted.OriginalLength &&
        //             linkPropertiesEncrypted.OriginalLength !==
        //             (this as CounterPassThroughStream).bytesReceived) {

        //             debug(`############### ` +
        //                 `LCP zlib.createInflateRaw LENGTH NOT MATCH ` +
        //                 `linkPropertiesEncrypted.OriginalLength !== bytesReceived:` +
        //                 `${linkPropertiesEncrypted.OriginalLength} !== ` +
        //                 `${(this as CounterPassThroughStream).bytesReceived}`);
        //         }
        //     })
        //     .on("error", function f() {
        //         debug("CounterPassThroughStream ERROR: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("pipe", function f() {
        //         debug("CounterPassThroughStream PIPE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("unpipe", function f() {
        //         debug("CounterPassThroughStream UNPIPE: " +
        //             (this as CounterPassThroughStream).id);
        //     })
        //     .on("drain", function f() {
        //         // debug("CounterPassThroughStream DRAIN: " +
        //         //     (this as CounterPassThroughStream).id);
        //     });
        // destStream = counterStream;
    }

    if (partialByteBegin < 0) {
        partialByteBegin = 0;
    }

    if (partialByteEnd < 0) {
        partialByteEnd = plainTextSize - 1;
        if (linkPropertiesEncrypted.OriginalLength) {
            partialByteEnd = linkPropertiesEncrypted.OriginalLength - 1;
        }
    }

    const l = (
        // !nativelyInflated &&
        linkPropertiesEncrypted.OriginalLength) ?
        linkPropertiesEncrypted.OriginalLength : plainTextSize;

    if (isPartialByteRangeRequest) {
        const rangeStream = new RangeStream(partialByteBegin, partialByteEnd, l);
        destStream.pipe(rangeStream);
        destStream = rangeStream;
        // l = partialByteLength;
    }

    const sal: IStreamAndLength = {
        length: l,
        reset: async () => {

            let resetedStream: IStreamAndLength;
            try {
                resetedStream = await stream.reset();
            } catch (err) {
                debug(err);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(err);
            }

            return transformStream(
                lcp, linkHref, linkPropertiesEncrypted,
                resetedStream,
                isPartialByteRangeRequest,
                partialByteBegin, partialByteEnd);
        },
        stream: destStream,
    };
    return Promise.resolve(sal);
}

export async function getDecryptedSizeStream(
    lcp: LCP,
    stream: IStreamAndLength): Promise<ICryptoInfo> {

    return new Promise<ICryptoInfo>(async (resolve, reject) => {

        // debug("LCP getDecryptedSizeStream() stream.length: " + stream.length);

        // debug("LCP getDecryptedSizeStream() AES_BLOCK_SIZE: " + AES_BLOCK_SIZE);

        // CipherText = IV + PlainText + BLOCK - (PlainText MOD BLOCK)
        // overflow: (PlainText MOD BLOCK) === PlainText - (floor(PlainText / BLOCK) * BLOCK)
        // thus: CipherText = IV + BLOCK * (floor(PlainText / BLOCK) + 1)

        // IV = AES_BLOCK_SIZE (first block in cyphertext)
        // + at least one block
        // (last one in cyphertext is either full 16-bytes random W3C padding
        // in case plaintext is exactly multiple of block size,
        // or partial cypher + padding)
        const TWO_AES_BLOCK_SIZE = 2 * AES_BLOCK_SIZE;
        if (stream.length < TWO_AES_BLOCK_SIZE) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject("crypto err");
            return;
        }
        const readPos = stream.length - TWO_AES_BLOCK_SIZE;

        const cypherRangeStream = new RangeStream(readPos, readPos + TWO_AES_BLOCK_SIZE - 1, stream.length);
        stream.stream.pipe(cypherRangeStream);

        // let buff: Buffer;
        // try {
        //     buff = await streamToBufferPromise(cypherRangeStream);
        // } catch (err) {
        //     debug(err);
        //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        //     reject("crypto err");
        //     return;
        // }

        // // debug("LCP getDecryptedSizeStream() buff.length: " + buff.length);

        // // // debug(buff.toString("hex"));
        // // for (let i = 0; i < buff.length; i++) {
        // //     const b = buff[i];
        // //     if (i === AES_BLOCK_SIZE) {
        // //         debug("____");
        // //     }
        // //     debug(b);
        // // }

        // resolve(this.getDecryptedSizeBuffer_(stream.length, buff));

        const decrypteds: Buffer[] = [];
        const handle = (ivBuffer: Buffer, encrypted: Buffer) => {

            const decryptStream = crypto.createDecipheriv("aes-256-cbc",
                // Note: assumes lcp.ContentKey has been set (can be undefined)
                // (this is only for testing the pure JS implementation anyway)
                lcp.ContentKey as Buffer, // Buffer.from(contentKey as string, "binary"),
                ivBuffer);
            decryptStream.setAutoPadding(false);

            const buff1 = decryptStream.update(encrypted);
            if (buff1) {
                decrypteds.push(buff1);
            }

            const buff2 = decryptStream.final();
            // debug(buff2.toString("hex"));
            if (buff2) {
                decrypteds.push(buff2);
            }

            finish();
        };

        let finished = false;
        const finish = () => {
            if (finished) {
                return;
            }
            finished = true;
            // cleanup();

            const decrypted = Buffer.concat(decrypteds);
            // debug(decrypted.toString("hex"));
            // debug(decrypted.length);
            if (decrypted.length !== AES_BLOCK_SIZE) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject("decrypted.length !== AES_BLOCK_SIZE");
                return;
            }

            const nPaddingBytes = decrypted[AES_BLOCK_SIZE - 1]; // decrypted.length = 1
            // debug(nPaddingBytes);

            const size = stream.length - AES_BLOCK_SIZE - nPaddingBytes;

            const res: ICryptoInfo = {
                length: size,
                padding: nPaddingBytes,
            };
            resolve(res);
        };

        try {
            const buf = await readStream(cypherRangeStream, TWO_AES_BLOCK_SIZE);
            if (!buf) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject("!buf (end?)");
                return;
            }
            if (buf.length !== TWO_AES_BLOCK_SIZE) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject("buf.length !== TWO_AES_BLOCK_SIZE");
                return;
            }
            handle(buf.slice(0, AES_BLOCK_SIZE), buf.slice(AES_BLOCK_SIZE));
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err);
            return;
        }

        // const cleanup = () => {
        //     cypherRangeStream.removeListener("readable", handleReadable);
        //     cypherRangeStream.removeListener("error", handleError);
        //     cypherRangeStream.removeListener("end", handleEnd);
        // };

        // const handleReadable = () => {
        //     // debug("readable");

        //     const ivBuffer = cypherRangeStream.read(AES_BLOCK_SIZE);
        //     if (!ivBuffer) {
        //         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        //         reject("!ivBuffer (end?)");
        //         return;
        //     }
        //     if (ivBuffer.length !== AES_BLOCK_SIZE) {
        //         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        //         reject("ivBuffer.length !== AES_BLOCK_SIZE");
        //         return;
        //     }

        //     const encrypted = cypherRangeStream.read(AES_BLOCK_SIZE);
        //     if (!encrypted) {
        //         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        //         reject("!encrypted (end?)");
        //         return;
        //     }
        //     if (encrypted.length !== AES_BLOCK_SIZE) {
        //         // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        //         reject("encrypted.length !== AES_BLOCK_SIZE");
        //         return;
        //     }

        //     handle(ivBuffer, encrypted);
        // };
        // cypherRangeStream.on("readable", handleReadable);

        // // // With NodeJS v8, this event is raised. Not with NodeJS 10+
        // // const handleEnd = () => {
        // //     finish();
        // // };
        // // cypherRangeStream.on("end", handleEnd);

        // const handleError = () => {
        //     cleanup();
        //     // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        //     reject();
        // };
        // cypherRangeStream.on("error", handleError);
    });
}
