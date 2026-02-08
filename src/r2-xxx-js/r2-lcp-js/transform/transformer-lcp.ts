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
// import { Transform } from "stream";

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

export async function transformStream(
    lcp: LCP,
    linkHref: string,
    linkPropertiesEncrypted: Encrypted,
    stream: IStreamAndLength,
    isPartialByteRangeRequest: boolean,
    partialByteBegin: number,
    partialByteEnd: number): Promise<IStreamAndLength> {

    const isCompressionNone = linkPropertiesEncrypted.Compression === "none";
    const isCompressionDeflate = linkPropertiesEncrypted.Compression === "deflate";

    let plainTextSize = -1;

    let nativelyDecryptedStream: NodeJS.ReadableStream | undefined;
    let nativelyInflated = false;
    if (lcp.isNativeNodePlugin()) {

        if (IS_DEV) {
            debug("LCP DECRYPT NATIVE: " + linkHref);
        }

        let fullEncryptedBuffer: Buffer;
        try {
            fullEncryptedBuffer = await streamToBufferPromise(stream.stream);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("OUCH!");
        }

        // debug(fullEncryptedBuffer.length);

        // debug(fullEncryptedBuffer.slice(0, 32));

        // debug(fullEncryptedBuffer.slice(fullEncryptedBuffer.length - 32));

        let res: IDecryptedBuffer;
        try {
            res = await lcp.decrypt(fullEncryptedBuffer, linkHref, isCompressionDeflate);
        } catch (err) {
            debug(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject("OUCH!");
        }

        const nativelyDecryptedBuffer = res.buffer;
        nativelyInflated = res.inflated;

        // debug(nativelyDecryptedBuffer.length);

        plainTextSize = nativelyDecryptedBuffer.length;
        linkPropertiesEncrypted.DecryptedLengthBeforeInflate = plainTextSize;

        if (!nativelyInflated && // necessary, even if isCompressionNone! (LCP inflation byte variance)
            linkPropertiesEncrypted.OriginalLength &&
            isCompressionNone &&
            linkPropertiesEncrypted.OriginalLength !== plainTextSize) {

            debug("############### LCP transformStream() LENGTH NOT MATCH linkPropertiesEncrypted.OriginalLength !== plainTextSize: " +
                `${linkPropertiesEncrypted.OriginalLength} !== ${plainTextSize}`);
        }

        nativelyDecryptedStream = bufferToStream(nativelyDecryptedBuffer);
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

    if (!nativelyInflated && isCompressionDeflate) {

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

    const l = (!nativelyInflated && linkPropertiesEncrypted.OriginalLength) ?
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
