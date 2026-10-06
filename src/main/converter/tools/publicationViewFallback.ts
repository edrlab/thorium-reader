// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import type { PublicationView } from "readium-desktop/common/views/publication";

const metadataIsMissing = (value: unknown): boolean => {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value === "string") {
        return !value.trim();
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === "object") {
        return Object.values(value).every(metadataIsMissing);
    }
    return false;
};

const metadataFallback = <T>(value: T | undefined, fallback: T | undefined): T | undefined =>
    metadataIsMissing(value) ? fallback : value;

const titleWithoutPlaceholder = <T>(title: T | undefined): T | undefined =>
    title === "-" ? undefined : title;

export const applyOpdsPublicationViewFallback = (
    publicationView: PublicationView,
    opdsPublicationView?: IOpdsPublicationView,
): PublicationView => {
    if (!opdsPublicationView) {
        return publicationView;
    }

    const documentTitle = metadataFallback(
        titleWithoutPlaceholder(publicationView.documentTitle),
        opdsPublicationView.documentTitle,
    ) || publicationView.documentTitle;
    const publicationTitle = metadataFallback(
        titleWithoutPlaceholder(publicationView.publicationTitle),
        opdsPublicationView.documentTitle,
    ) || documentTitle;
    const authorsLangString = opdsPublicationView.authorsLangString?.map(
        (contributor) => contributor.nameLangString,
    );
    const publishersLangString = opdsPublicationView.publishersLangString?.map(
        (contributor) => contributor.nameLangString,
    );
    const tags = opdsPublicationView.tags?.map((tag) => tag.name);

    return {
        ...publicationView,
        documentTitle,
        publicationTitle,
        authorsLangString: metadataFallback(publicationView.authorsLangString, authorsLangString) || [],
        publishersLangString: metadataFallback(publicationView.publishersLangString, publishersLangString),
        description: metadataFallback(publicationView.description, opdsPublicationView.description),
        languages: metadataFallback(publicationView.languages, opdsPublicationView.languages),
        workIdentifier: metadataFallback(publicationView.workIdentifier, opdsPublicationView.workIdentifier),
        publishedAt: metadataFallback(publicationView.publishedAt, opdsPublicationView.publishedAt),
        tags: metadataFallback(publicationView.tags, tags),
        duration: metadataFallback(publicationView.duration, opdsPublicationView.duration),
        nbOfTracks: metadataFallback(publicationView.nbOfTracks, opdsPublicationView.nbOfTracks),
        a11y_accessMode: metadataFallback(publicationView.a11y_accessMode, opdsPublicationView.a11y_accessMode),
        a11y_accessibilityFeature: metadataFallback(
            publicationView.a11y_accessibilityFeature,
            opdsPublicationView.a11y_accessibilityFeature,
        ),
        a11y_accessibilityHazard: metadataFallback(
            publicationView.a11y_accessibilityHazard,
            opdsPublicationView.a11y_accessibilityHazard,
        ),
        a11y_certifiedBy: metadataFallback(publicationView.a11y_certifiedBy, opdsPublicationView.a11y_certifiedBy),
        a11y_certifierCredential: metadataFallback(
            publicationView.a11y_certifierCredential,
            opdsPublicationView.a11y_certifierCredential,
        ),
        a11y_certifierReport: metadataFallback(
            publicationView.a11y_certifierReport,
            opdsPublicationView.a11y_certifierReport,
        ),
        a11y_conformsTo: metadataFallback(publicationView.a11y_conformsTo, opdsPublicationView.a11y_conformsTo),
        a11y_accessModeSufficient: metadataFallback(
            publicationView.a11y_accessModeSufficient,
            opdsPublicationView.a11y_accessModeSufficient,
        ),
        a11y_accessibilitySummary: metadataFallback(
            publicationView.a11y_accessibilitySummary,
            opdsPublicationView.a11y_accessibilitySummary,
        ),
    };
};
