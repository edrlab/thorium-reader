// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { getOpdsFeedColor, getOpdsFeedIconUrl, OpdsFeed } from "./opds";

export interface RegistryFeed extends OpdsFeed {
    iconUrl?: string;
}

export interface RegistrySearchResult {
    feeds: RegistryFeed[];
    hasNext: boolean;
}

// Registry JSON is external input. Only catalog links are addable feeds;
// self links point to registry descriptions, not the catalog itself.
export const parseRegistrySearch = (value: unknown): RegistrySearchResult => {
    if (!value || typeof value !== "object" || !("catalogs" in value) || !Array.isArray(value.catalogs)) {
        throw new Error("Invalid registry response");
    }
    const feeds: RegistryFeed[] = [];
    for (const catalog of value.catalogs) {
        const metadata = catalog?.metadata;
        if (typeof metadata?.title !== "string" || !metadata.title.trim() || !Array.isArray(catalog?.links)) continue;
        const link = (rel: string) => catalog.links.find((item: { rel?: unknown; href?: unknown; templated?: unknown }) =>
            (item?.rel === rel || (Array.isArray(item?.rel) && item.rel.includes(rel))) &&
            !item.templated && getOpdsFeedIconUrl(item.href));
        const url = link("catalog")?.href;
        if (!url || feeds.some((feed) => feed.url === url)) continue;
        feeds.push({
            title: metadata.title,
            url,
            authenticationUrl: link("authenticate")?.href,
            color: getOpdsFeedColor(metadata.color),
            iconUrl: link("icon")?.href,
        });
    }
    const links = "links" in value && Array.isArray(value.links) ? value.links : [];
    return { feeds, hasNext: links.some((link) => link?.rel === "next" ||
        (Array.isArray(link?.rel) && link.rel.includes("next"))) };
};
