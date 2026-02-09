// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";
import * as querystring from "querystring";

export function isHTTP(urlOrPath: string): boolean {
    return /^https?:\/\//.test(urlOrPath);
}

export function encodeURIComponent_RFC3986(str: string): string {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c: string) => {
            return "%" + c.charCodeAt(0).toString(16);
        });
}

export function encodeURIComponent_RFC5987(str: string): string {
    return encodeURIComponent(str).
        replace(/['()]/g, querystring.escape). // i.e., %27 %28 %29
        replace(/\*/g, "%2A").
        // |`^
        replace(/%(?:7C|60|5E)/g, querystring.unescape);
}

// TODO: use URI/URL lib to do this?
export function ensureAbsolute(rootUrl: string, linkHref: string) {
    let url = linkHref;
    if (!isHTTP(url) && url.indexOf("data:") !== 0) {

        if (url.indexOf("//") === 0) {
            if (rootUrl.indexOf("https://") === 0) {
                url = "https:" + url;
            } else {
                url = "http:" + url;
            }
            return url;
        }

        if (url[0] === "/") {
            const j = rootUrl.replace(/:\/\//g, ":__").indexOf("/");
            const rootUrlOrigin = rootUrl.substr(0, j);
            url = path.join(rootUrlOrigin, url);
        } else {
            const i = rootUrl.indexOf("?");
            let rootUrlWithoutQuery = rootUrl;
            if (i >= 0) {
                rootUrlWithoutQuery = rootUrlWithoutQuery.substr(0, i);
            }

            if (rootUrlWithoutQuery.substr(-1) === "/") {
                url = path.join(rootUrlWithoutQuery, url);
            } else {
                url = path.join(path.dirname(rootUrlWithoutQuery), url);
            }
        }
        url = url.replace(/\\/g, "/").replace(/^https:\//g, "https:\/\/").replace(/^http:\//g, "http:\/\/");
    }
    return url;
}
