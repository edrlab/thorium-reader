// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

// Encode without padding
// And apply RFC 4648
export function encodeB64(data: string) {
    let encoded = btoa(unescape(encodeURIComponent(data)));

    // RFC 4648
    encoded = encoded.replace(/\//g, "_");
    encoded = encoded.replace(/\+/g, "-");

    // Remove padding
    encoded = encoded.replace(/=/g, "");

    return encoded;
}

export function decodeB64(data: string) {
    let decoded = data;
    decoded = decoded.replace(/_/g, "/");
    decoded = decoded.replace(/-/g, "+");

    // const paddingLength = (3 - (decoded.length % 3)) % 3;

    decoded = decodeURIComponent(escape(atob(decoded)));
    return decoded;
}
