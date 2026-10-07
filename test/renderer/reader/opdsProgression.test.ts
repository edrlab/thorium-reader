// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";

import { opdsProgressionToLocator } from "readium-desktop/renderer/reader/opdsProgression";
import { createReadiumPositionList, mapLocatorToReadiumPosition } from "readium-desktop/common/readium/positions";
import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";
import { ArchiveProperties, LayoutEnum, Properties } from "@r2-shared-js/models/metadata-properties";

const weightedPublication = (fixedLayout = false): Publication => {
    const publication = new Publication();
    publication.Spine = [1, 7, 2].map((count, index) => {
        const link = new Link();
        link.Href = `chapter-${index + 1}.xhtml`;
        link.TypeLink = "application/xhtml+xml";
        link.Properties = new Properties();
        link.Properties.Archive = new ArchiveProperties();
        link.Properties.Archive.EntryLength = count * 1024;
        if (fixedLayout) {
            link.Properties.Layout = LayoutEnum.Fixed;
        }
        return link;
    });
    return publication;
};

const spine = [
    { Href: "chapter-1.xhtml" },
    { Href: "chapter-2.xhtml" },
    { Href: "chapter-3.xhtml" },
    { Href: "chapter-4.xhtml" },
];

describe("OPDS total progression navigation", () => {
    it.each([
        [0, "chapter-1.xhtml", 0, 1],
        [0.1, "chapter-2.xhtml", 0, 2],
        [0.45, "chapter-2.xhtml", 0.5, 5],
        [0.8, "chapter-3.xhtml", 0, 9],
        [0.9, "chapter-3.xhtml", 0.5, 10],
    ])("maps %p using unequal Readium resource weights", (progression, href, offset, position) => {
        const publication = weightedPublication();
        const positionList = createReadiumPositionList(publication);
        const locator = opdsProgressionToLocator(progression as number, publication.Spine, positionList);
        expect(locator.href).toBe(href);
        expect(locator.type).toBe("application/xhtml+xml");
        expect(locator.locations.progression).toBeCloseTo(offset as number);
        expect(locator.locations.position).toBe(position);
        expect(locator.locations.totalProgression).toBeCloseTo(progression as number);
        expect(mapLocatorToReadiumPosition(locator, positionList)).toEqual(locator);
    });

    it("uses a safe end offset in the final weighted resource", () => {
        const publication = weightedPublication();
        const locator = opdsProgressionToLocator(1, publication.Spine, createReadiumPositionList(publication));
        expect(locator.href).toBe("chapter-3.xhtml");
        expect(locator.locations).toEqual({ progression: 0.95, position: 10, totalProgression: 0.99 });
    });

    it("gives fixed-layout pages one position each regardless of byte length", () => {
        const publication = weightedPublication(true);
        const locator = opdsProgressionToLocator(0.5, publication.Spine, createReadiumPositionList(publication));
        expect(locator.href).toBe("chapter-2.xhtml");
        expect(locator.locations).toEqual({ progression: 0.5, position: 2, totalProgression: 0.5 });
    });

    it("falls back to spine weights for an empty position list", () => {
        expect(opdsProgressionToLocator(0.5, spine, { resources: [], positions: [], total: 0 }))
            .toEqual(opdsProgressionToLocator(0.5, spine));
    });

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

    it("rejects an empty spine and ignores unusable spine entries", () => {
        expect(opdsProgressionToLocator(0.5, [])).toBeUndefined();
        expect(opdsProgressionToLocator(0.5, [{}, { Href: "chapter.xhtml" }])).toEqual({
            href: "chapter.xhtml",
            locations: { progression: 0.5 },
        });
    });
});
