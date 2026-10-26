// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const getCatalogUrls = (params: URLSearchParams): { url: string; authenticationUrl?: string } => {
    const bookshelf = params.get("bookshelf") || undefined;
    const main = params.get("main") || undefined;
    const url = main || bookshelf;
    if (!url) {
        throw new Error("A catalog main or bookshelf URL is required");
    }
    for (const value of [url, bookshelf]) {
        if (value === undefined) continue;
        const parsed = new URL(value);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new Error("Catalog URLs must use HTTP or HTTPS");
        }
    }
    return { url, authenticationUrl: bookshelf };
};
