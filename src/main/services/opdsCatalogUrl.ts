// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { OpdsFeed } from "readium-desktop/common/models/opds";
import { httpGetWithAuth } from "readium-desktop/main/network/http";
import { contentTypeisOpds, contentTypeisOpdsAuth, contentTypeisXml, parseContentType } from "readium-desktop/utils/contentType";

const normalize = (value: string): string => {
    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") return value;
        url.hash = "";
        return url.toString();
    } catch {
        return value;
    }
};

const resolveCatalogUrl = async (value: string): Promise<string> => {
    try {
        const response = await httpGetWithAuth(false)(value);
        try {
            const type = parseContentType(response.contentType);
            // Do not replace catalog URLs with an HTML sign-in page after a redirect.
            if (contentTypeisOpds(type) || contentTypeisXml(type)) {
                const target = new URL(response.responseUrl || value);
                if (contentTypeisOpdsAuth(type)) {
                    const source = new URL(value);
                    // An authentication endpoint is not the catalog's canonical URL.
                    // Accept a scheme upgrade only when it keeps the same resource.
                    if (source.hostname !== target.hostname || source.pathname !== target.pathname ||
                        source.search !== target.search || source.port !== target.port) return normalize(value);
                } else if (!response.isSuccess) {
                    return normalize(value);
                }
                if (target.protocol === "http:" || target.protocol === "https:") return normalize(target.toString());
            }
        } finally {
            response.response?.body?.resume();
        }
    } catch {
        // Offline links must still be addable; never guess a redirect.
    }
    return normalize(value);
};

export const findDeeplinkCatalog = async <T extends OpdsFeed>(url: string, feeds: T[]): Promise<{ url: string; feed?: T }> => {
    const normalized = normalize(url);
    const exact = feeds.find((feed) => normalize(feed.url) === normalized);
    if (exact) return { url: exact.url, feed: exact };
    const canonical = await resolveCatalogUrl(normalized);
    const redirected = feeds.find((feed) => normalize(feed.url) === canonical);
    if (redirected) return { url: redirected.url, feed: redirected };

    // A badge may arrive after an older opds:// link was stored as HTTP.
    // Only compare its HTTP counterpart, and require a real redirect match.
    const counterpart = new URL(canonical);
    if (counterpart.protocol === "https:") {
        counterpart.protocol = "http:";
        for (const feed of feeds.filter((entry) => normalize(entry.url) === counterpart.toString())) {
            if (await resolveCatalogUrl(feed.url) === canonical) return { url: feed.url, feed };
        }
    }
    return { url: canonical };
};
