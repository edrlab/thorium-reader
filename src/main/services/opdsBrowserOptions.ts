// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readOpdsBrowserLinks, IOpdsBrowserOptions } from "readium-desktop/common/models/opdsBrowserOptions";
import { getAuthenticationToken, httpGet } from "readium-desktop/main/network/http";
import { opdsCredentialUrl } from "./opdsLogout";
import { isOpdsAuthenticated } from "./opdsAuthenticated";
import { ContentType, contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";

export async function getOpdsBrowserOptions(catalogUrl: string, currentUrl: string, authenticationUrl?: string, bookshelfUrl?: string): Promise<IOpdsBrowserOptions> {
    const current = opdsCredentialUrl(currentUrl);
    const token = await getAuthenticationToken(current);
    const catalogToken = await getAuthenticationToken(opdsCredentialUrl(catalogUrl));
    const result: IOpdsBrowserOptions = { catalogUrl, links: {}, authenticated: !!token?.accessToken };
    if (catalogUrl.startsWith("apiapp://")) return result;
    const urls = new Set([catalogUrl, token?.opdsAuthenticationUrl, catalogToken?.opdsAuthenticationUrl, authenticationUrl].filter(Boolean));
    // Discover navigation metadata only; profile data is fetched only when explicitly opened.
    for (const candidate of urls) {
        try {
            const url = new URL(candidate, catalogUrl);
            if (url.protocol !== "http:" && url.protocol !== "https:") continue;
            const response = await httpGet(url.toString());
            try {
                const type = parseContentType(response.contentType);
                if ((!response.isSuccess && !contentTypeisOpdsAuth(type)) ||
                    (type !== ContentType.Opds2 && !contentTypeisOpdsAuth(type))) continue;
                const doc = await response.response.json() as { links?: unknown };
                const base = response.responseUrl || url.toString();
                result.links = { ...result.links, ...readOpdsBrowserLinks(doc?.links, base) };
                if (!contentTypeisOpdsAuth(type) && Array.isArray(doc?.links)) {
                    const auth = doc.links.find((link: { rel?: string | string[]; href?: string }) =>
                        (Array.isArray(link?.rel) ? link.rel : [link?.rel]).includes("authenticate"));
                    if (auth?.href && urls.size < 6) urls.add(new URL(auth.href, base).toString());
                }
            } finally {
                response.response?.body?.resume();
            }
        } catch { /* An optional unavailable document must not disable the menu. */ }
    }
    if (!result.authenticated && (result.links.shelf || bookshelfUrl)) {
        result.authenticated = await isOpdsAuthenticated(current, result.links.shelf?.url || bookshelfUrl);
    }
    return result;
}
