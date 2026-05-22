// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// Strict RFC 4122
// UUIDv4 validation would require "4" as the first nibble of the 3rd group
// and one of "8", "9", "a", or "b" as the first nibble of the 4th group.
// const UUID_V4_FORMAT_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

import debug_ from "debug";

const debug = debug_("readium-desktop:utils:uuid");

const UUID_V4_CANONICAL_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UUID_V4_FORMAT_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const formatUUIDv4 = (bytes: Uint8Array): string => {

    // https://github.com/uuidjs/uuid/blob/89a5ebcc56999fc25c95350f922693b71fb11d32/src/v4.ts#L43-L45
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`.toLowerCase();
};

export const uuidv4 = (): string => {
    // https://nodejs.org/docs/latest-v24.x/api/webcrypto.html#web-crypto-api
    const crypto = globalThis.crypto; // === require("node:crypto").webcrypto

    // --------
    // see tsconfig.json, and tsconfig_main/renderer.json
    // ATTTEMPT TO EXCLUDE LIB.DOM FAILS BECAUSE:
    // node_modules/xpath/xpath.d.ts
    // node_modules/@types/jsdom/base.d.ts
    // and LIB.DOM.ITERABLE:
    // node_modules/@types/jsdom/base.d.ts
    // --------
    // console.log(typeof window); // typescript/lib/lib.dom.d.ts
    // console.log(typeof document); // typescript/lib/lib.dom.d.ts
    // console.log(typeof Range); // typescript/lib/lib.dom.d.ts
    // console.log(typeof navigator); // typescript/lib/lib.dom.d.ts AND @types/node/web-globals (lib.dom and lib.webworker compatibility)
    // console.log(typeof crypto); // typescript/lib/lib.dom.d.ts AND @types/node/web-globals (lib.dom compatibility)
    // // import { performance } from "node:perf_hooks";
    // console.log(typeof performance); // typescript/lib/lib.dom.d.ts AND @types/node/perf_hooks.d.ts

    if (typeof crypto?.randomUUID === "function") {
        debug("crypto.randomUUID found");
        return crypto.randomUUID();
    }

    if (typeof crypto?.getRandomValues === "function") {
        debug("fallback to crypto.getRandomValues");
        return formatUUIDv4(crypto.getRandomValues(new Uint8Array(16)));
    }

    debug("globalThis.crypto unavailable", crypto);
    throw new Error("crypto.getRandomValues() is not available in this runtime");
};

export const isUUIDv4 = (uuid: string | undefined) => UUID_V4_CANONICAL_REGEX.test(uuid);

export const canonicalizeUUIDv4 = (uuid: string | undefined): string | undefined => {
    if (!UUID_V4_FORMAT_REGEX.test(uuid)) {
        return undefined;
    }
    return uuid.toLowerCase();
};

export const assertUUIDv4 = (uuid: string | undefined) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};
