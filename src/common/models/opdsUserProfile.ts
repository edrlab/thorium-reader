// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IOpdsUserProfileQuota {
    total?: number;
    available?: number;
}

export interface IOpdsUserProfile {
    bookshelfUrl?: string;
    name?: string;
    email?: string;
    loans?: IOpdsUserProfileQuota;
    holds?: IOpdsUserProfileQuota;
    editUrl?: string;
}

const object = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

export const resolveOpdsProfileUrl = (value: unknown, baseUrl: string): string | undefined => {
    if (typeof value !== "string" || !value.trim()) return undefined;
    try {
        const url = new URL(value, baseUrl);
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
    } catch {
        return undefined;
    }
};

export const findOpdsProfileLink = (links: unknown, rel: string, baseUrl: string, type: string): string | undefined => {
    if (!Array.isArray(links)) return undefined;
    for (const value of links) {
        const link = object(value);
        const relations = Array.isArray(link?.rel) ? link.rel : [link?.rel];
        if (relations.includes(rel) && typeof link?.type === "string" &&
            link.type.split(";")[0].trim().toLowerCase() === type) {
            const url = resolveOpdsProfileUrl(link.href, baseUrl);
            if (url) return url;
        }
    }
    return undefined;
};

const quota = (value: unknown): IOpdsUserProfileQuota | undefined => {
    const data = object(value);
    if (!data) return undefined;
    const count = (n: unknown): number | undefined =>
        typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : undefined;
    return { total: count(data.total), available: count(data.available) };
};

export const parseOpdsUserProfile = (value: unknown, baseUrl: string): IOpdsUserProfile | undefined => {
    const data = object(value);
    if (!data) return undefined;
    return {
        name: typeof data.name === "string" ? data.name : undefined,
        email: typeof data.email === "string" ? data.email : undefined,
        loans: quota(data.loans),
        holds: quota(data.holds),
        editUrl: findOpdsProfileLink(data.links, "edit", baseUrl, "text/html"),
    };
};
