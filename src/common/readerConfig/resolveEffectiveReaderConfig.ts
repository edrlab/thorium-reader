// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { ReaderConfig } from "readium-desktop/common/models/reader";
import { PublicationView } from "readium-desktop/common/views/publication";

import { detectReaderConfigPublicationFormat, ReaderConfigPublicationFormat } from "./publicationFormat";

export type ReaderConfigByPublicationFormat =
    Partial<Record<ReaderConfigPublicationFormat, Partial<ReaderConfig>>>;

export interface IResolveEffectiveReaderConfig {
    globalConfig: ReaderConfig;
    publicationConfig?: Partial<ReaderConfig>;
    publicationView?: Partial<PublicationView>;
    r2Publication?: R2Publication;
    allowLocalConfig?: boolean;
    globalConfigByFormat?: ReaderConfigByPublicationFormat;
    localConfigByFormat?: ReaderConfigByPublicationFormat;
}

function inferPublicationLang(
    publicationView: Partial<PublicationView> | undefined,
    r2Publication: R2Publication | undefined,
): string | undefined {
    const publicationViewLanguage = publicationView?.languages?.[0];
    if (publicationViewLanguage) {
        return publicationViewLanguage;
    }

    const publicationLanguage = r2Publication?.Metadata?.Language;
    if (typeof publicationLanguage === "string") {
        return publicationLanguage;
    }
    if (Array.isArray(publicationLanguage) && publicationLanguage[0]) {
        return publicationLanguage[0];
    }

    return undefined;
}

function inferPublicationReadingDirection(
    publicationView: Partial<PublicationView> | undefined,
    r2Publication: R2Publication | undefined,
): ReaderConfig["readingDirection"] {
    const direction = (r2Publication?.Metadata?.Direction || "").toLowerCase();
    if (direction === "rtl" || direction === "ltr" || direction === "ttb" || direction === "btt") {
        return direction as ReaderConfig["readingDirection"];
    }

    if (publicationView?.isFixedLayoutPublication) {
        return "auto";
    }

    return undefined;
}

export function resolveEffectiveReaderConfig(params: IResolveEffectiveReaderConfig): ReaderConfig {
    const {
        globalConfig,
        publicationConfig,
        publicationView,
        r2Publication,
        allowLocalConfig = true,
        globalConfigByFormat,
        localConfigByFormat,
    } = params;

    const format = detectReaderConfigPublicationFormat(publicationView, r2Publication);
    const globalFormatConfig = globalConfigByFormat?.[format] || {};
    const localFormatConfig = localConfigByFormat?.[format] || {};

    // Merge order documents the intended model: global, then format-specific,
    // then local layers when local settings are enabled.
    const resolved = {
        ...globalConfig,
        ...globalFormatConfig,
        ...(allowLocalConfig ? localFormatConfig : {}),
        ...(allowLocalConfig ? (publicationConfig || {}) : {}),
    };

    if (allowLocalConfig) {
        if (!resolved.lang) {
            resolved.lang = inferPublicationLang(publicationView, r2Publication);
        }
        if (!resolved.readingDirection) {
            resolved.readingDirection = inferPublicationReadingDirection(publicationView, r2Publication);
        }
    }

    return resolved;
}
