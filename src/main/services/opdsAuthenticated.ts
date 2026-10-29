// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { getAuthenticationToken, httpGet } from "readium-desktop/main/network/http";
import { ContentType, contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";

// A cookie's presence alone is not proof of login: verify the saved bookshelf.
export const isOpdsAuthenticated = async (catalogUrl: URL, bookshelfUrl?: string): Promise<boolean> => {
    const token = await getAuthenticationToken(catalogUrl);
    if (token?.accessToken) return true;
    if (!bookshelfUrl) return false;
    try {
        const url = new URL(bookshelfUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") return false;
        let response = await httpGet(url.toString());
        if (contentTypeisOpdsAuth(parseContentType(response.contentType))) {
            const authentication = await response.response.json();
            const links = authentication && typeof authentication === "object" && "links" in authentication ? authentication.links : undefined;
            if (!Array.isArray(links)) return false;
            const shelf = links.find((link) => {
                const rel = Array.isArray(link?.rel) ? link.rel : [link?.rel];
                return rel.includes("http://opds-spec.org/shelf") || rel.includes("shelf");
            });
            if (typeof shelf?.href !== "string") return false;
            const shelfUrl = new URL(shelf.href, response.responseUrl || url.toString());
            if (shelfUrl.protocol !== "https:" && shelfUrl.protocol !== "http:") return false;
            response = await httpGet(shelfUrl.toString());
        }
        if (!response.isSuccess || parseContentType(response.contentType) !== ContentType.Opds2) return false;
        const document = await response.response.json();
        return !!document && typeof document === "object" && !("authentication" in document) &&
            ("metadata" in document || "publications" in document || "navigation" in document || "groups" in document);
    } catch {
        return false;
    }
};
