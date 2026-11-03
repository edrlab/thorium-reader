// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { removeCookiesFromHost } from "readium-desktop/main/network/fetch";
import { deleteAuthenticationToken } from "readium-desktop/main/network/http";

export function opdsCredentialUrl(value: string): URL {
    let url: URL;
    if (value.startsWith("apiapp://")) {
        const [identifier, endpoint] = value.slice("apiapp://".length).split(":apiapp:");
        url = new URL(endpoint);
        url.host = "apiapploans.org.edrlab.thoriumreader.break." + identifier + ".break." + url.host;
    } else { url = new URL(value); }
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid catalog URL");
    return url;
}

export async function logoutOpdsCatalog(catalogUrl: string, currentUrl?: string): Promise<void> {
    const hosts = new Set<string>();
    for (const value of [catalogUrl, currentUrl].filter(Boolean)) {
        const url = opdsCredentialUrl(value);
        if (hosts.has(url.host)) continue;
        hosts.add(url.host);
        await removeCookiesFromHost(url.hostname);
        await deleteAuthenticationToken(url.host);
    }
}
