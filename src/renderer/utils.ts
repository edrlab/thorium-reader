// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function buildOpdsBrowserRoute(
    rootFeedIdentifier: string,
    title: string,
    url: string,
    level?: number,
) {
    if (level == null) {
        level = 1;
    }
    const route = `/opds/${rootFeedIdentifier}/browse/` + level
        + `/${encodeB64(title)}/${encodeB64(url)}`;

    return route;
}

// Encode without padding
// And apply RFC 4648
export function encodeB64(data: any) {
    let encoded = btoa(data);

    // RFC 4648
    encoded = encoded.replace(/\//g, "_");
    encoded = encoded.replace(/\[+]/g, "-");

    // Remove padding
    encoded = encoded.replace(/=/g, "");
    return encoded;
}

export function decodeB64(data: any) {
    let decoded = data;
    decoded = decoded.replace(/_/g, "/");
    decoded = decoded.replace(/-/g, "+");

    // Add padding
    const paddingLength = (3 - (decoded.length % 3)) % 3;
    decoded = atob(decoded);
    return decoded;
}

export function parseOpdsBrowserRoute(route: string) {
    // Parse route with regexp
    // tslint:disable-next-line:max-line-length
    const regexp =  /\/opds\/([a-zA-Z0-9-=]+)\/browse\/([0-9]+)\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/g;
    const match = regexp.exec(route);

    if (match == null) {
        return null;
    }

    const rootFeedIdentifier = match[1];
    const level = parseInt(match[2], 10);
    const title = decodeB64(match[3]);
    const url = decodeB64(match[4]);

    return {
        rootFeedIdentifier,
        title,
        url,
        level,
    };
}
