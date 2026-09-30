// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";

import type { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import type { PublicationView } from "readium-desktop/common/views/publication";
import { applyOpdsPublicationViewFallback } from "readium-desktop/main/converter/tools/publicationViewFallback";

const publicationView = (metadata: Partial<PublicationView> = {}): PublicationView => ({
    identifier: "local-publication-id",
    isOpenable: true,
    readingFinished: false,
    documentTitle: "-",
    publicationTitle: "",
    publicationSubTitle: "",
    authorsLangString: [],
    ...metadata,
});

const opdsPublicationView = (): IOpdsPublicationView => ({
    baseUrl: "https://example.com/catalog.json",
    documentTitle: "OPDS title",
    authorsLangString: [{ nameLangString: "OPDS author", link: [] }],
    publishersLangString: [{ nameLangString: { en: "OPDS publisher" }, link: [] }],
    workIdentifier: "opds-work-id",
    description: "OPDS description",
    numberOfPages: 42,
    tags: [{ name: "OPDS subject", link: [] }],
    languages: ["en"],
    publishedAt: "2026-09-28T00:00:00.000Z",
    duration: 3600,
    nbOfTracks: 12,
    a11y_accessMode: ["textual"],
    a11y_accessibilityFeature: ["tableOfContents"],
    a11y_accessibilityHazard: ["none"],
    a11y_certifiedBy: ["OPDS certifier"],
    a11y_certifierCredential: ["OPDS credential"],
    a11y_certifierReport: ["https://example.com/report"],
    a11y_conformsTo: ["EPUB Accessibility 1.1 - WCAG 2.2 Level AA"],
    a11y_accessModeSufficient: [["textual"]],
    a11y_accessibilitySummary: { en: "OPDS accessibility summary" },
    catalogLinkView: [],
});

describe("applyOpdsPublicationViewFallback", () => {
    it("fills missing local metadata from the persisted OPDS publication", () => {
        const result = applyOpdsPublicationViewFallback(publicationView(), opdsPublicationView());

        expect(result).toMatchObject({
            documentTitle: "OPDS title",
            publicationTitle: "OPDS title",
            authorsLangString: ["OPDS author"],
            publishersLangString: [{ en: "OPDS publisher" }],
            workIdentifier: "opds-work-id",
            description: "OPDS description",
            tags: ["OPDS subject"],
            languages: ["en"],
            publishedAt: "2026-09-28T00:00:00.000Z",
            duration: 3600,
            nbOfTracks: 12,
            a11y_accessMode: ["textual"],
            a11y_accessibilityFeature: ["tableOfContents"],
            a11y_accessibilityHazard: ["none"],
            a11y_certifiedBy: ["OPDS certifier"],
            a11y_certifierCredential: ["OPDS credential"],
            a11y_certifierReport: ["https://example.com/report"],
            a11y_conformsTo: ["EPUB Accessibility 1.1 - WCAG 2.2 Level AA"],
            a11y_accessModeSufficient: [["textual"]],
            a11y_accessibilitySummary: { en: "OPDS accessibility summary" },
        });
    });

    it("keeps local publication metadata ahead of OPDS fallback metadata", () => {
        const localMetadata = publicationView({
            documentTitle: "Local title",
            publicationTitle: { en: "Local publication title" },
            authorsLangString: ["Local author"],
            publishersLangString: ["Local publisher"],
            workIdentifier: "local-work-id",
            description: "Local description",
            tags: ["Local subject"],
            languages: ["fr"],
            publishedAt: "2020-01-01T00:00:00.000Z",
            duration: 120,
            nbOfTracks: 2,
            a11y_accessMode: ["auditory"],
            a11y_accessibilitySummary: "Local accessibility summary",
        });

        const result = applyOpdsPublicationViewFallback(localMetadata, opdsPublicationView());

        expect(result).toMatchObject({
            documentTitle: "Local title",
            publicationTitle: { en: "Local publication title" },
            authorsLangString: ["Local author"],
            publishersLangString: ["Local publisher"],
            workIdentifier: "local-work-id",
            description: "Local description",
            tags: ["Local subject"],
            languages: ["fr"],
            publishedAt: "2020-01-01T00:00:00.000Z",
            duration: 120,
            nbOfTracks: 2,
            a11y_accessMode: ["auditory"],
            a11y_accessibilitySummary: "Local accessibility summary",
        });
    });

    it("returns the original view when there is no persisted OPDS publication", () => {
        const localMetadata = publicationView();

        expect(applyOpdsPublicationViewFallback(localMetadata)).toBe(localMetadata);
    });
});
