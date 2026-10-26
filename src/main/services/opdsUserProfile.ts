// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IOpdsUserProfile } from "readium-desktop/common/models/opdsUserProfile";
import { findOpdsProfileLink, parseOpdsUserProfile, resolveOpdsProfileUrl } from "readium-desktop/common/models/opdsUserProfile";
import { getAuthenticationToken, httpGet } from "readium-desktop/main/network/http";
import { ContentType, contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";

// Fetch on demand: personal information is never written to the catalog repository.
export const getOpdsUserProfile = async (catalogUrl: string, authenticationUrl?: string): Promise<IOpdsUserProfile | undefined> => {
    try {
        const catalog = resolveOpdsProfileUrl(catalogUrl, catalogUrl);
        if (!catalog) return undefined;
        const token = await getAuthenticationToken(new URL(catalog));
        if (!token?.accessToken && !authenticationUrl) return undefined;
        const authUrl = resolveOpdsProfileUrl(token?.opdsAuthenticationUrl || authenticationUrl, catalog);
        if (!authUrl) return undefined;
        const authentication = await httpGet(authUrl);
        if (!authentication.isSuccess && !contentTypeisOpdsAuth(parseContentType(authentication.contentType))) return undefined;
        const doc = await authentication.response.json();
        if (!doc || typeof doc !== "object" || !("links" in doc)) return undefined;
        const profileUrl = findOpdsProfileLink(doc.links, "profile", authentication.responseUrl || authUrl, ContentType.OpdsProfile);
        const bookshelfUrl = findOpdsProfileLink(doc.links, "http://opds-spec.org/shelf", authentication.responseUrl || authUrl, ContentType.Opds2) ||
            findOpdsProfileLink(doc.links, "shelf", authentication.responseUrl || authUrl, ContentType.Opds2);
        const bookshelf = bookshelfUrl ? { bookshelfUrl } : undefined;
        if (!profileUrl) return bookshelf;
        const response = await httpGet(profileUrl, { headers: { Accept: ContentType.OpdsProfile } });
        if (!response.isSuccess || parseContentType(response.contentType) !== ContentType.OpdsProfile) return bookshelf;
        const profile = parseOpdsUserProfile(await response.response.json(), response.responseUrl || profileUrl);
        return profile ? { ...profile, ...bookshelf } : bookshelf;
    } catch {
        // A missing or unavailable optional profile must not prevent account logout.
        return undefined;
    }
};
