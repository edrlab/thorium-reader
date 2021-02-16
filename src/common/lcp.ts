// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// Safeguard / sanity check to prevent native LCP lib crash (uncaught exception in NodeJS)
// https://readium.org/lcp-specs/releases/lcp/latest.html#33-core-license-information
// TOOD: moving this to LCP.init() wouldn't help
// as we need to capture this error early in the application logical layer / data flow
export function lcpLicenseIsNotWellFormed(lcpJson: any): boolean {
    // lcpJson.updated is optional
    // obviously, we could also check deeper inner object properties,
    // but this surface object shape check is sufficient to capture HTTP 500 JSON response body, etc.
    return !lcpJson.id ||
        !lcpJson.provider ||
        !lcpJson.issued ||
        !lcpJson.encryption ||
        !lcpJson.links ||
        !lcpJson.signature;
}
