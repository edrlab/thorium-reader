// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const EPUB_CONTAINER_ROOT_URL = "https://epub.example.org/";

function tryDecodeURIComponentSilent(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch (_err) {
        return value;
    }
}

function normalizeSlashes(value: string): string {
    return value.replace(/\\/g, "/");
}

export function normalizeEpubResourceHref(href: string): string | undefined {
    const trimmedHref = normalizeSlashes(href.trim());
    if (!trimmedHref) {
        return undefined;
    }

    // Annotation files can come from other tools and may serialize target.source
    // as an absolute URL. Thorium spine hrefs remain container-relative paths.
    // The artificial root lets the URL parser normalize relative EPUB paths too.
    const baseUrl = new URL(EPUB_CONTAINER_ROOT_URL);

    try {
        const parsedUrl = new URL(trimmedHref, baseUrl);
        parsedUrl.hash = "";

        if (parsedUrl.origin === baseUrl.origin) {
            return tryDecodeURIComponentSilent(parsedUrl.pathname.replace(/^\/+/, ""));
        }

        return parsedUrl.toString();
    } catch (_err) {
        return undefined;
    }
}

function hrefCandidates(value: string): string[] {
    const candidates = new Set<string>();
    const decodedValue = tryDecodeURIComponentSilent(value);

    for (const candidateValue of [value, decodedValue]) {
        for (const normalized of [normalizeEpubResourceHref(candidateValue)]) {
            if (normalized) {
                candidates.add(normalized);
            }
        }
    }

    return Array.from(candidates);
}

function hrefCandidateMatches(sourceCandidate: string, spineCandidate: string): boolean {
    // Some external annotation exports keep a full URL or a longer container path.
    // Accept suffix matches only when the resolver finds a single spine candidate.
    return sourceCandidate === spineCandidate ||
        sourceCandidate.endsWith(`/${spineCandidate}`) ||
        spineCandidate.endsWith(`/${sourceCandidate}`);
}

export function resolveReadiumAnnotationSourceHref(
    source: string,
    spineHrefs: string[],
): string | undefined {
    if (!source) {
        return undefined;
    }

    if (spineHrefs.includes(source)) {
        return source;
    }

    const sourceCandidates = hrefCandidates(source);
    if (!sourceCandidates.length) {
        return undefined;
    }

    const matchingSpineHrefs = spineHrefs.filter((spineHref) => {
        const spineCandidates = hrefCandidates(spineHref);

        return sourceCandidates.some((sourceCandidate) =>
            spineCandidates.some((spineCandidate) => hrefCandidateMatches(sourceCandidate, spineCandidate)));
    });

    return matchingSpineHrefs.length === 1 ? matchingSpineHrefs[0] : undefined;
}
