// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IOpdsLinkView, IOpdsNavigationLink } from "readium-desktop/common/views/opds";

export type OpdsBrowserDestination = "shelf" | "wishlist" | "history" | "profile";
export type OpdsBrowserLinks = Partial<Record<OpdsBrowserDestination, IOpdsLinkView>>;
export interface IOpdsBrowserOptions {
    catalogUrl: string;
    links: OpdsBrowserLinks;
    authenticated: boolean;
}

const relations: Record<OpdsBrowserDestination, string[]> = {
    shelf: ["http://opds-spec.org/shelf", "shelf"],
    wishlist: ["http://opds-spec.org/wishlist"],
    history: ["http://opds-spec.org/history"],
    profile: ["profile"],
};

export function readOpdsBrowserLinks(values: unknown, baseUrl: string): OpdsBrowserLinks {
    const links: OpdsBrowserLinks = {};
    if (!Array.isArray(values)) return links;
    for (const value of values) {
        if (!value || typeof value !== "object" || typeof value.href !== "string") continue;
        let url: URL;
        try { url = new URL(value.href, baseUrl); } catch { continue; }
        if (url.protocol !== "http:" && url.protocol !== "https:") continue;
        const rel = Array.isArray(value.rel) ? value.rel : [value.rel];
        for (const key of Object.keys(relations) as OpdsBrowserDestination[]) {
            if (!links[key] && relations[key].some(relation => rel.includes(relation))) {
                links[key] = { url: url.toString(), type: typeof value.type === "string" ? value.type : undefined,
                    title: typeof value.title === "string" ? value.title : undefined };
            }
        }
    }
    return links;
}

export function opdsBrowserLinksFromView(links?: IOpdsNavigationLink): OpdsBrowserLinks {
    const result: OpdsBrowserLinks = {};
    const entries: [OpdsBrowserDestination, IOpdsLinkView | undefined][] = [
        ["shelf", links?.bookshelf?.[0]], ["wishlist", links?.wishlist?.[0]],
        ["history", links?.history?.[0]], ["profile", links?.profile?.[0]],
    ];
    for (const [key, link] of entries) {
        if (link?.url && /^https?:\/\//i.test(link.url)) result[key] = link;
    }
    return result;
}
