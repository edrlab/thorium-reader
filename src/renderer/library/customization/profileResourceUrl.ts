// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

const PROFILE_ASSET_ORIGIN = "https://profile.invalid";

export function resolveProfileAssetUrl(
    assetUrl: string,
    screenHref: string,
    customizationBaseUrl: string,
): string {
    try {
        const screenUrl = new URL(screenHref, `${PROFILE_ASSET_ORIGIN}/`);
        const resolvedAssetUrl = new URL(assetUrl, screenUrl);
        if (resolvedAssetUrl.origin !== PROFILE_ASSET_ORIGIN) {
            return assetUrl;
        }

        const assetPath = decodeURIComponent(resolvedAssetUrl.pathname).replace(/^\/+/, "");
        const encodedPath = encodeURIComponent_RFC3986(Buffer.from(assetPath).toString("base64"));
        return `${customizationBaseUrl}${encodedPath}${resolvedAssetUrl.search}${resolvedAssetUrl.hash}`;
    } catch {
        return assetUrl;
    }
}