// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "node:crypto";
import { uuidv4 } from "readium-desktop/utils/uuid";

const salt = crypto.randomBytes(16).toString("hex");
export const OPDS_AUTH_ENCRYPTION_KEY_BUFFER = crypto.pbkdf2Sync(uuidv4(), salt, 1000, 32, "sha256");
export const OPDS_AUTH_ENCRYPTION_KEY_HEX = OPDS_AUTH_ENCRYPTION_KEY_BUFFER.toString("hex");

const AES_BLOCK_SIZE = 16;
export const OPDS_AUTH_ENCRYPTION_IV_BUFFER = Buffer.from(uuidv4()).slice(0, AES_BLOCK_SIZE);
export const OPDS_AUTH_ENCRYPTION_IV_HEX = OPDS_AUTH_ENCRYPTION_IV_BUFFER.toString("hex");

// https://github.com/edrlab/thorium-reader-website/blob/59c09aa5af6f4cc86ef87333f6f80b0057116216/docs/badge-page.md?plain=1#L33

export const opdsFeedColors = [
    "gray",
    "red",
    "yellow",
    "blue",
    "green",
    "purple",
    "orange",
    "pink",
] as const;

export type TOpdsFeedColor = typeof opdsFeedColors[number];

export const OPDS_FEED_DEFAULT_COLOR: TOpdsFeedColor = "gray";

export const isOpdsFeedColor = (value: unknown): value is TOpdsFeedColor =>
    typeof value === "string" && (opdsFeedColors as readonly string[]).includes(value);

export const getOpdsFeedColor = (value: unknown): TOpdsFeedColor =>
    isOpdsFeedColor(value) ? value : OPDS_FEED_DEFAULT_COLOR;

export const OPDS_FEED_ICON_DATA_URL_PREFIX = "data:image/png;base64,";

export const isOpdsFeedIconUrl = (value: unknown): value is string => {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

export const getOpdsFeedIconUrl = (value: unknown): string | undefined =>
    isOpdsFeedIconUrl(value) ? value : undefined;

export const isOpdsFeedIconDataUrl = (value: unknown): value is string => {
    if (typeof value !== "string" || !value.startsWith(OPDS_FEED_ICON_DATA_URL_PREFIX)) {
        return false;
    }

    const data = value.slice(OPDS_FEED_ICON_DATA_URL_PREFIX.length);
    return !!data && /^[A-Za-z0-9+/]+={0,2}$/.test(data);
};

export const getOpdsFeedIcon = (value: unknown): string | undefined =>
    isOpdsFeedIconDataUrl(value) ? value : undefined;

export interface OpdsFeed {
    identifier?: string;
    title: string;
    url: string;
    authenticationUrl?: string;
    favorite?: boolean;
    color?: TOpdsFeedColor;
    icon?: string;
}
