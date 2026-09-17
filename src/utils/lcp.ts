// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "node:crypto";

// SHA256 - 32 bytes - 64 chars
const LCP_HASHED_PASSPHRASE_BYTES = 32;
const LCP_HASHED_PASSPHRASE_HEX_LENGTH = LCP_HASHED_PASSPHRASE_BYTES * 2;

export function toSha256Hex(data: string) {
    const checkSum = crypto.createHash("sha256");
    checkSum.update(data);
    return checkSum.digest("hex");
}

/* previous implementation
let lcpHashedPassphrase: string;
if (typeof lcpHashedPassphraseObj === "string") {
    const lcpHashedPassphraseHexOrB64 = lcpHashedPassphraseObj as string;
    let isHex = false;
    try {
        const low1 = lcpHashedPassphraseHexOrB64.toLowerCase();
        const buff = Buffer.from(low1, "hex");
        const str = buff.toString("hex");
        const low2 = str.toLowerCase();
        isHex = low1 === low2;
        if (!isHex) {
            debug(`OPDS lcp_hashed_passphrase should be HEX! (${lcpHashedPassphraseHexOrB64}) ${low1} !== ${low2}`);
        } else {
            debug(`OPDS lcp_hashed_passphrase is HEX: ${lcpHashedPassphraseHexOrB64}`);
        }
    } catch (err) {
        debug(err); // ignore
    }
    if (isHex) {
        lcpHashedPassphrase = lcpHashedPassphraseHexOrB64;
    } else {
        let isBase64 = false;
        try {
            const buff = Buffer.from(lcpHashedPassphraseHexOrB64, "base64");
            const str = buff.toString("hex");
            const b64 = Buffer.from(str, "hex").toString("base64");
            isBase64 = lcpHashedPassphraseHexOrB64 === b64;
            if (!isBase64) {
                debug(`OPDS lcp_hashed_passphrase is not BASE64?! (${lcpHashedPassphraseHexOrB64}) ${lcpHashedPassphraseHexOrB64} !== ${b64}`);
            } else {
                debug(`OPDS lcp_hashed_passphrase is BASE64! (${lcpHashedPassphraseHexOrB64})`);
            }
        } catch (err) {
            debug(err); // ignore
        }
        if (isBase64) {
            lcpHashedPassphrase = Buffer.from(lcpHashedPassphraseHexOrB64, "base64").toString("hex");
        }
    }
}
*/

export function normalizeLcpHashedPassphrase(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const lcpHashedPassphraseHexOrB64 = value.trim();
    if (!lcpHashedPassphraseHexOrB64) {
        return undefined;
    }

    const lowerCaseHex = lcpHashedPassphraseHexOrB64.toLowerCase();
    if (
        lowerCaseHex.length === LCP_HASHED_PASSPHRASE_HEX_LENGTH &&
        /^[0-9a-f]+$/.test(lowerCaseHex)
    ) {
        return lowerCaseHex;
    }

    try {
        const buffer = Buffer.from(lcpHashedPassphraseHexOrB64, "base64");
        if (
            buffer.length === LCP_HASHED_PASSPHRASE_BYTES &&
            buffer.toString("base64") === lcpHashedPassphraseHexOrB64
        ) {
            return buffer.toString("hex");
        }
    } catch {
        // ignore
    }

    return undefined;
}

export function getLcpHashedPassphrase(
    passphrase: string | null | undefined,
    hashedPassphrase: string | null | undefined,
): string | undefined {
    const normalizedHashedPassphrase = normalizeLcpHashedPassphrase(hashedPassphrase);
    if (normalizedHashedPassphrase) {
        return normalizedHashedPassphrase;
    }

    return typeof passphrase === "string" && passphrase.length ?
        toSha256Hex(passphrase) :
        undefined;
}
