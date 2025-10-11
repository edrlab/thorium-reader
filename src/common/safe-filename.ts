// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import slugify from "slugify";
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from "util";
import path from "path";

// https://github.com/parshap/node-sanitize-filename/blob/209c39b914c8eb48ee27bcbde64b2c7822fdf3de/index.js#L1
// https://gist.github.com/barbietunnie/7bc6d48a424446c44ff4
// https://github.com/parshap/truncate-utf8-bytes/blob/4212839ea184e74fb81f1e4e633e1db794ebe4f4/lib/truncate.js#L1

const truncateUnicode = (sanitized: string, length: number): string => {
    if (typeof window !== "undefined" && typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined") {
        const uint8Array = new TextEncoder().encode(sanitized);
        const truncated = uint8Array.slice(0, length);
        return new TextDecoder().decode(truncated);
    } else {
        const uint8Array = new NodeTextEncoder().encode(sanitized);
        const truncated = uint8Array.slice(0, length);
        return new NodeTextDecoder("utf-8").decode(truncated);
    }
};

const illegalRe = /[\/\?<>\\:\*\|"]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const windowsTrailingRe = /[\.\s]+$/;

const replacement = "_";

export function sanitizeForFilename(str: string) {
    const trimmedAndWhitespaceCollapsed = str.trim().replace(/\s\s+/g, " ");
    try {
        const normalized = trimmedAndWhitespaceCollapsed
            .replace(illegalRe, replacement)
            .replace(controlRe, replacement)
            .replace(reservedRe, replacement)
            .replace(windowsReservedRe, replacement)
            .replace(windowsTrailingRe, replacement);
        const extension = path.extname(normalized) || "";
        const filenameWithoutExt = path.basename(normalized, extension) || "";
        const joined = (filenameWithoutExt.replace(/[\.\s]+$/, "") || replacement) + "." + (extension.replace(/^[\.\s]+/, "") || "ext");
        return truncateUnicode(joined, 255);
    } catch (_e) {
        return slugify(trimmedAndWhitespaceCollapsed.replace(/\/|\\/g, "_")).replace(/:/g, "-").substring(0, 100) || "FILE";
    }
}
