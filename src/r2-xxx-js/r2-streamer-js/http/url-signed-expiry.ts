// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as crypto from "crypto";

import { traverseJsonObjects } from "@r2-utils-js/_utils/JsonUtils";

const debug = debug_("r2:streamer#http/url-signed-expiry");

const DEFAULT_EXPIRE_SECONDS = 86400; // 24h

export const URL_SIGNED_EXPIRY_QUERY_PARAM_NAME = "r2tkn";

// lazy / just-in-time evaluation, no caching!
// (can be changed at runtime to invalidate existing URL expiry signatures)
const computeHashSecret = () => {
    if (!process.env.R2_STREAMER_URL_EXPIRE_SECRET) {
        return undefined;
    }
    const checkSumSecret = crypto.createHash("sha256");
    checkSumSecret.update(process.env.R2_STREAMER_URL_EXPIRE_SECRET);
    const hashSecret = checkSumSecret.digest("hex");
    // debug(`ENV secret: ${process.env.R2_STREAMER_URL_EXPIRE_SECRET} => ${hashSecret}`);
    return hashSecret;
};

// Environment variables:
//
// R2_STREAMER_URL_EXPIRE_SECRET
// => arbitrary string of characters,
//    no length constraints
//    (will be checksum'ed using fixed-length SHA256 digest)
//    if absent, the function does nothing,
//    otherwise the resource URLs of the given publication will be altered to include a new query param for the signed expiry
//
// R2_STREAMER_URL_EXPIRE_SECONDS
// => string that parses to integer,
//    number of seconds
//    (default is 86400 === 24h)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signExpiringResourceURLs = (rootUrl: string, pathBase64Str: string, jsonObj: any) => {

    // debug(`pathBase64Str: ${pathBase64Str}`);
    // reqparams.pathBase64 is already decoded!
    // const decoded = decodeURIComponent(reqparams.pathBase64);
    // const pathBase64Str = Buffer.from(reqparams.pathBase64, "base64").toString("utf8");

    const hashSecret = computeHashSecret();
    if (!hashSecret) {
        return;
    }

    // milliseconds since epoch (midnight, 1 Jan 1970)
    const timestamp = Date.now(); // +new Date()
    // Number.MAX_SAFE_INTEGER
    // 2^53 - 1 === Math.pow(2, 53) - 1
    // 9007199254740991 === 9,007,199,254,740,991 (~9 quadrillion)
    // => 285,420.92 years :)
    // const nowToB36 = timestamp.toString(36);
    // const nowFromB36 = parseInt(nowToB36, 36);
    // debug(`Date.Now base36: ${timestamp} => ${nowToB36} => ${nowFromB36}`);

    let expiry = DEFAULT_EXPIRE_SECONDS;
    if (process.env.R2_STREAMER_URL_EXPIRE_SECONDS) {
        try {
            expiry = parseInt(process.env.R2_STREAMER_URL_EXPIRE_SECONDS, 10);
        } catch (err) {
            debug(err);
        }
    }
    // debug(`URL expiry: ${expiry}`);

    traverseJsonObjects(jsonObj,
        (obj) => {
            if (obj.href && typeof obj.href === "string"
                && !/^https?:\/\//.test(obj.href) && !/^data:\/\//.test(obj.href)) {

                // EXAMPLES:
                // obj.href === "./EPUB/path/to/audio.mp3#t=123" (TOC)
                // obj.href === "EPUB/path/to/chapter.html" (spine/reading-order, or resources collection)

                const publicationRootUrl = new URL(`${rootUrl}/`); // manifest.json
                // debug(`------------ publicationRootUrl: ${publicationRootUrl.toString()}`);
                const url = new URL(obj.href, publicationRootUrl);
                const resourcePath = url.pathname.replace(publicationRootUrl.pathname, "");
                // debug(`------------ Link HREF (absolute URL): ${obj.href} => ${url.toString()} (${resourcePath})`);

                const checkSumData = crypto.createHash("sha256");
                checkSumData.update(`${timestamp}_${hashSecret}_${resourcePath}_${expiry}_${pathBase64Str}`);
                const hashData = checkSumData.digest("hex");

                const queryParamJson = {
                    hash: hashData,
                    timestamp, // milliseconds
                    expiry, // seconds
                };

                const queryParamValue = Buffer.from(JSON.stringify(queryParamJson)).toString("base64");

                // implicit encodeURIComponent_RFC3986()
                url.searchParams.append(URL_SIGNED_EXPIRY_QUERY_PARAM_NAME, queryParamValue);
                // debug(`======= Link HREF (BEFORE): ${obj.href}`);
                obj.href = url.toString().replace(publicationRootUrl.toString(), ""); // make relative again
                // debug(`======= Link HREF (AFTER): ${obj.href}`);
            }
        });
};

export const verifyExpiringResourceURL = (queryParamValue: string | undefined, pathBase64Str: string, pathInZip: string): boolean => {

    const hashSecret = computeHashSecret();
    if (!hashSecret) {
        return true;
    }

    if (!queryParamValue) {
        return false;
    }
    try {
        // queryParamValue is already decodeURIComponent() (reverse of encodeURIComponent_RFC3986())
        const queryParamStr = Buffer.from(queryParamValue, "base64").toString("utf8");
        const json = JSON.parse(queryParamStr);

        if (!json.hash || !json.timestamp || !json.expiry) {
            return false;
        }

        const resourcePath = pathInZip;
        const checkSumData = crypto.createHash("sha256");
        checkSumData.update(`${json.timestamp}_${hashSecret}_${resourcePath}_${json.expiry}_${pathBase64Str}`);
        const hashData = checkSumData.digest("hex");
        if (hashData !== json.hash) {
            debug(`HASH diff! ${hashData} !== ${json.hash} (${resourcePath})`);
            return false;
        }

        const timestamp = Date.now(); // +new Date()
        const timeDiff = timestamp - json.timestamp;
        if (timeDiff > (json.expiry * 1000)) {
            debug(`Resource EXPIRED! ${timeDiff} > ${json.expiry} (${resourcePath})`);
            return false;
        }

        return true;

    } catch (e) {
        debug(e);
    }
    return false;
};
