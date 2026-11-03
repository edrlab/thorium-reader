// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { findOpdsShelfLink, resolveOpdsShelfUrl } from "readium-desktop/common/models/opdsShelf";
import { ContentType } from "readium-desktop/utils/contentType";
import { getAuthenticationToken, httpGet } from "readium-desktop/main/network/http";

// Discover the shelf on demand without fetching personal information.
export const getOpdsBookshelfUrl = async (catalogUrl: string, authenticationUrl?: string): Promise<string> => {
    const fallback = authenticationUrl || catalogUrl;
    try {
        const token = await getAuthenticationToken(new URL(catalogUrl));
        const authUrl = resolveOpdsShelfUrl(token?.opdsAuthenticationUrl || authenticationUrl, catalogUrl);
        if (!authUrl) return fallback;
        const response = await httpGet(authUrl);
        const doc = await response.response.json();
        if (!doc || typeof doc !== "object" || !("links" in doc)) return fallback;
        return findOpdsShelfLink(doc?.links, "http://opds-spec.org/shelf", response.responseUrl || authUrl, ContentType.Opds2) ||
            findOpdsShelfLink(doc?.links, "shelf", response.responseUrl || authUrl, ContentType.Opds2) || fallback;
    } catch {
        // Let normal OPDS browsing request authentication when required.
        return fallback;
    }
};
