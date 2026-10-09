// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

const PROFILE_ASSET_ORIGIN = "https://profile.invalid";

export function resolveProfileAssetUrl(
    assetUrl: string,
    screenHref: string,
    customizationBaseUrl: string,
): string {
    // Fragment-only references (for example SVG filters) belong to this document.
    if (assetUrl.startsWith("#")) {
        return assetUrl;
    }
    try {
        const screenUrl = new URL(screenHref, `${PROFILE_ASSET_ORIGIN}/`);
        const resolvedAssetUrl = new URL(assetUrl, screenUrl);
        if (resolvedAssetUrl.origin !== PROFILE_ASSET_ORIGIN) {
            return assetUrl;
        }

        const assetPath = decodeURIComponent(resolvedAssetUrl.pathname).replace(/^\/+/, "");
        const encodedPath = encodeURIComponent_RFC3986(Buffer.from(assetPath).toString("base64"));
        return `${customizationBaseUrl}${encodedPath}${resolvedAssetUrl.search}${resolvedAssetUrl.hash}`;
    } catch {
        return assetUrl;
    }
}

export function resolveProfileSrcset(
    srcset: string,
    screenHref: string,
    customizationBaseUrl: string,
): string {
    // Follow srcset's token boundaries: commas can be part of a URL (notably
    // data URLs), while descriptors end at a comma outside parentheses.
    let position = 0;
    const candidates: string[] = [];
    while (position < srcset.length) {
        while (/[\t\n\f\r ,]/.test(srcset[position] || "") && position < srcset.length) {
            position++;
        }
        const start = position;
        while (position < srcset.length && !/[\t\n\f\r ]/.test(srcset[position])) {
            position++;
        }
        const token = srcset.slice(start, position);
        if (!token) {
            break;
        }
        const url = token.replace(/,+$/, "");
        let descriptors = "";
        if (!token.endsWith(",")) {
            const descriptorStart = position;
            let parentheses = 0;
            while (position < srcset.length) {
                const character = srcset[position];
                if (character === "," && parentheses === 0) {
                    break;
                }
                if (character === "(") {
                    parentheses++;
                } else if (character === ")") {
                    parentheses = Math.max(0, parentheses - 1);
                }
                position++;
            }
            descriptors = srcset.slice(descriptorStart, position).trim();
        }
        candidates.push(`${resolveProfileAssetUrl(url, screenHref, customizationBaseUrl)}${descriptors ? ` ${descriptors}` : ""}`);
    }
    return candidates.join(", ");
}

const decodeCssEscapes = (value: string): string => value.replace(
    /\\(?:([\da-f]{1,6})[\t\n\f\r ]?|([\s\S]))/gi,
    (_match: string, hex: string | undefined, character: string | undefined) => {
        if (hex) {
            const codePoint = parseInt(hex, 16);
            return String.fromCodePoint(codePoint === 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff) ? 0xfffd : codePoint);
        }
        return character === "\n" || character === "\r" || character === "\f" ? "" : character || "";
    },
);

export function resolveProfileCssUrls(
    css: string,
    screenHref: string,
    customizationBaseUrl: string,
): string {
    // Consume comments and strings first so literal text such as
    // content: 'url(example.png)' is never rewritten. URL tokens support CSS
    // escapes and quoted parentheses; output is always a quoted CSS string.
    return css.replace(
        /\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|((?:[\w-]|\\(?:[\da-f]{1,6}[\t\n\f\r ]?|[^\r\n\f]))+)\(\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)'|((?:\\(?:[\da-f]{1,6}[\t\n\f\r ]?|[^\r\n\f])|[^\s'"()\\])*))\s*\)/gi,
        (match: string, name: string | undefined, doubleQuoted: string | undefined, singleQuoted: string | undefined, unquoted: string | undefined) => {
            if (!name || decodeCssEscapes(name).toLowerCase() !== "url") {
                return match;
            }
            const url = decodeCssEscapes(doubleQuoted ?? singleQuoted ?? unquoted ?? "");
            const resolved = resolveProfileAssetUrl(url, screenHref, customizationBaseUrl);
            if (resolved === url) {
                return match;
            }
            return `url("${resolved.replace(/["\\\n\r\f]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `)}")`;
        },
    );
}
