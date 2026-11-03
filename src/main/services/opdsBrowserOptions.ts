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
    const requested = new Set<string>();
    const discovered = new Set<string>();
    async function readMenuLinks(candidate: string, discoverAuthenticationDocument: boolean) {
        if (!candidate) return;
        try {
            const url = new URL(candidate, catalogUrl);
            if (url.protocol !== "http:" && url.protocol !== "https:") return;
            const href = url.toString();
            if (requested.has(href)) return;
            requested.add(href);
            const response = await httpGet(href);
            try {
                const type = parseContentType(response.contentType);
                if ((!response.isSuccess && !contentTypeisOpdsAuth(type)) ||
                    (type !== ContentType.Opds2 && !contentTypeisOpdsAuth(type))) return;
                const doc = await response.response.json() as { links?: unknown };
                const base = response.responseUrl || href;
                result.links = { ...result.links, ...readOpdsBrowserLinks(doc?.links, base) };
                const links = doc?.links;
                if (discoverAuthenticationDocument && type === ContentType.Opds2 && Array.isArray(links)) {
                    const auth = links.find((link: { rel?: string | string[]; href?: string }) =>
                        (Array.isArray(link?.rel) ? link.rel : [link?.rel]).includes("http://opds-spec.org/auth/document"));
                    if (auth?.href) discovered.add(new URL(auth.href, base).toString());
                }
            } finally {
                response.response?.body?.resume();
            }
        } catch { /* An optional unavailable document must not disable the menu. */ }
    }

    // Later responses override earlier destinations. Read the catalog first,
    // then saved and explicit endpoints, then advertised authentication documents.
    for (const candidate of [catalogUrl, token?.opdsAuthenticationUrl, catalogToken?.opdsAuthenticationUrl, authenticationUrl]) {
        await readMenuLinks(candidate, true);
    }
    for (const candidate of discovered) {
        await readMenuLinks(candidate, false);
    }
    if (!result.authenticated && (result.links.shelf || bookshelfUrl)) {
        result.authenticated = await isOpdsAuthenticated(current, result.links.shelf?.url || bookshelfUrl);
    }
    return result;
}
