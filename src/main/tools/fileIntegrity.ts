// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as fs from "fs";

export interface ISha256FileHash {
    base64: string;
    base64url: string;
    base64urlWithPadding: string;
    hex: string;
}

/**
 * Normalizes SHA-256 hash strings for textual comparisons.
 *
 * LCP publication links can express the same digest with optional prefixes
 * such as "sha256-" / "sha256=" / "sha256:". Hex digests are also
 * case-insensitive, so we lowercase 64-character hex strings. Base64 digests
 * are case-sensitive and must be left unchanged.
 */
export const normalizeSha256HashForComparison = (hash: string | undefined): string | undefined => {

    if (!hash) {
        return undefined;
    }

    const normalizedHash = hash.trim()
        // Match a leading SHA-256 label at the start of the string:
        // "sha256-", "sha256=", "sha256:", "sha-256-", "sha-256=", or "sha-256:".
        .replace(/^sha-?256[-=:]/i, "");
    if (!normalizedHash) {
        return undefined;
    }

    // Match exactly 64 hexadecimal characters, the textual length of a
    // SHA-256 digest encoded as hex. The "i" flag accepts uppercase hex.
    return /^[0-9a-f]{64}$/i.test(normalizedHash) ?
        normalizedHash.toLowerCase() :
        normalizedHash;
};

export async function computeFileSha256(filePath: string): Promise<ISha256FileHash> {

    const hasher = crypto.createHash("sha256");
    await new Promise<void>((resolve, reject) => {
        const readStream = fs.createReadStream(filePath); // autoClose === true, readStream.isPaused() === true

        readStream.on("error", reject);
        readStream.on("end", resolve);

        // piping API
        readStream.pipe(hasher);

        // flowing mode
        // readStream.on("data", (chunk: Buffer | string) => {
        //     hasher.update(chunk);
        // });

        // paused mode
        // readStream.on("readable", () => {
        //     const chunk = readStream.read();
        //     if (chunk) {
        //         hasher.update(chunk);
        //     } else {
        //         process.nextTick(() => {
        //             try {
        //                 readStream.destroy();
        //             } catch (err) {
        //                 console.log(`ERROR CLOSING STREAM: ${pathFile}`);
        //                 console.log(err);
        //             }
        //         });
        //         resolve();
        //     }
        // });
    });

    const digest = hasher.digest();
    const base64 = digest.toString("base64");
    const base64urlWithPadding = base64
        // Base64url replaces every "+" from standard base64 with "-".
        .replace(/\+/g, "-")
        // Base64url replaces every "/" from standard base64 with "_".
        .replace(/\//g, "_");
    return {
        base64,
        base64url: base64urlWithPadding
            // Base64url commonly omits trailing "=" padding characters.
            .replace(/=+$/, ""),
        base64urlWithPadding,
        hex: digest.toString("hex"),
    };
}

export const fileSha256MatchesExpectedHash = (
    expectedHash: string | undefined,
    actualHash: ISha256FileHash,
): boolean => {

    // LCP servers may publish the same SHA-256 digest as hex, base64, or
    // base64url. Integrity verification should accept any matching encoding.
    const normalizedExpectedHash = normalizeSha256HashForComparison(expectedHash);
    if (!normalizedExpectedHash) {
        return true;
    }

    // normalizeSha256HashForComparison() already lowercases valid hex, so this
    // exact 64-character lowercase hex match is enough here.
    if (/^[0-9a-f]{64}$/.test(normalizedExpectedHash)) {
        return normalizedExpectedHash === actualHash.hex;
    }

    return normalizedExpectedHash === actualHash.base64 ||
        normalizedExpectedHash === actualHash.base64url ||
        normalizedExpectedHash === actualHash.base64urlWithPadding;
};
