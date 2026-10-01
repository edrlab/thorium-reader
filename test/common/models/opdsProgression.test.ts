// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";

import {
    locatorToOpdsProgression,
    opdsProgressionIsNewer,
    opdsProgressionMatchesAppliedProgression,
    opdsProgressionToLocator,
} from "readium-desktop/common/models/opdsProgression";

const spine = [
    { Href: "chapter-1.xhtml" },
    { Href: "chapter-2.xhtml" },
    { Href: "chapter-3.xhtml" },
    { Href: "chapter-4.xhtml" },
];

describe("OPDS progression timestamps", () => {
    it("accepts a valid remote timestamp when no local locator exists", () => {
        expect(opdsProgressionIsNewer("2026-09-30T10:00:00Z", undefined)).toBe(true);
    });

    it("requires the remote timestamp to be strictly newer", () => {
        const local = Date.parse("2026-09-30T10:00:00Z");
        expect(opdsProgressionIsNewer("2026-09-30T10:00:00Z", local)).toBe(false);
        expect(opdsProgressionIsNewer("2026-09-30T09:59:59Z", local)).toBe(false);
        expect(opdsProgressionIsNewer("2026-09-30T10:00:01Z", local)).toBe(true);
    });

    it("rejects an invalid remote timestamp", () => {
        expect(opdsProgressionIsNewer("not-a-date", undefined)).toBe(false);
    });
});

describe("OPDS total progression mapping", () => {
    describe("publication progression to locator", () => {
        it.each([
            [0, "chapter-1.xhtml", 0],
            [0.25, "chapter-2.xhtml", 0],
            [0.625, "chapter-3.xhtml", 0.5],
            [0.999, "chapter-4.xhtml", 0.996],
            [1, "chapter-4.xhtml", 0.95],
        ])("maps %p to a spine resource and local progression", (progression, href, localProgression) => {
            expect(opdsProgressionToLocator(progression as number, spine)).toEqual({
                href,
                locations: { progression: localProgression },
            });
        });

        it.each([-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid progression %p", (progression) => {
            expect(opdsProgressionToLocator(progression, spine)).toBeUndefined();
        });
    });

    describe("locator to publication progression", () => {
        it.each([
            ["chapter-1.xhtml", 0, 0],
            ["chapter-1.xhtml", 1, 0.25],
            ["chapter-2.xhtml", 0, 0.25],
            ["chapter-3.xhtml", 0.5, 0.625],
            ["chapter-4.xhtml", 1, 1],
        ])("maps %s at %p to %p", (href, resourceProgression, progression) => {
            expect(
                locatorToOpdsProgression(
                    {
                        href: href as string,
                        locations: { progression: resourceProgression as number },
                    },
                    spine,
                ),
            ).toBe(progression);
        });

        it.each([
            undefined,
            {},
            { href: "" },
            { href: "chapter-1.xhtml" },
            { href: "chapter-1.xhtml", locations: {} },
            { href: "chapter-1.xhtml", locations: { progression: -0.1 } },
            { href: "chapter-1.xhtml", locations: { progression: 1.1 } },
            { href: "chapter-1.xhtml", locations: { progression: Number.NaN } },
            { href: "chapter-1.xhtml", locations: { progression: Number.POSITIVE_INFINITY } },
            { href: "missing.xhtml", locations: { progression: 0.5 } },
        ])("rejects an invalid or unmatched locator %#", (locator) => {
            expect(locatorToOpdsProgression(locator, spine)).toBeUndefined();
        });
    });

    it("rejects an empty spine and consistently ignores unusable spine entries", () => {
        expect(opdsProgressionToLocator(0.5, [])).toBeUndefined();
        expect(
            locatorToOpdsProgression(
                {
                    href: "chapter.xhtml",
                    locations: { progression: 0.5 },
                },
                undefined,
            ),
        ).toBeUndefined();

        const spineWithUnusableEntries = [{}, { Href: "chapter-1.xhtml" }, { Href: "" }, { Href: "chapter-2.xhtml" }];
        expect(opdsProgressionToLocator(0.75, spineWithUnusableEntries)).toEqual({
            href: "chapter-2.xhtml",
            locations: { progression: 0.5 },
        });
        expect(
            locatorToOpdsProgression(
                {
                    href: "chapter-2.xhtml",
                    locations: { progression: 0.5 },
                },
                spineWithUnusableEntries,
            ),
        ).toBe(0.75);
    });

    it.each([0, 0.01, 0.25, 0.625, 0.75, 0.9875, 0.999])("round-trips publication progression %p", (progression) => {
        const locator = opdsProgressionToLocator(progression, spine);
        expect(locatorToOpdsProgression(locator, spine)).toBeCloseTo(progression, 12);
    });

    it("keeps the exact-end navigation safety offset separate from uploaded progression", () => {
        const safeEndLocator = opdsProgressionToLocator(1, spine);
        expect(safeEndLocator?.locations.progression).toBe(0.95);
        // 0.95 is also a legitimate ordinary position in the last resource,
        // so the inverse cannot infer that it originated from the safe-end
        // navigation sentinel. Programmatic remote navigation is suppressed by
        // the sync coordinator instead.
        expect(locatorToOpdsProgression(safeEndLocator, spine)).toBe(0.9875);
        expect(
            locatorToOpdsProgression(
                {
                    href: "chapter-4.xhtml",
                    locations: { progression: 1 },
                },
                spine,
            ),
        ).toBe(1);
    });

    it("recognizes an already-applied future-dated remote position on reopen", () => {
        const remoteModified = "2040-01-01T00:00:00.001Z";
        const localModifiedTime = Date.parse("2026-10-01T10:00:00.000Z");
        const persistedSafeEnd = locatorToOpdsProgression(opdsProgressionToLocator(1, spine), spine);

        expect(opdsProgressionIsNewer(remoteModified, localModifiedTime)).toBe(true);
        expect(opdsProgressionMatchesAppliedProgression(1, persistedSafeEnd, spine)).toBe(true);
        expect(opdsProgressionMatchesAppliedProgression(1, 1, spine)).toBe(true);
        expect(opdsProgressionMatchesAppliedProgression(0.75, 0.5, spine)).toBe(false);
    });
});
