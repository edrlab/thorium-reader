// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const object = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

export const resolveOpdsShelfUrl = (value: unknown, baseUrl: string): string | undefined => {
    if (typeof value !== "string" || !value.trim()) return undefined;
    try {
        const url = new URL(value, baseUrl);
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
    } catch {
        return undefined;
    }
};

export const findOpdsShelfLink = (links: unknown, rel: string, baseUrl: string, type: string): string | undefined => {
    if (!Array.isArray(links)) return undefined;
    for (const value of links) {
        const link = object(value);
        const relations = Array.isArray(link?.rel) ? link.rel : [link?.rel];
        if (relations.includes(rel) && typeof link?.type === "string" &&
            link.type.split(";")[0].trim().toLowerCase() === type) {
            const url = resolveOpdsShelfUrl(link.href, baseUrl);
            if (url) return url;
        }
    }
    return undefined;
};
