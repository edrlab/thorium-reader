// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";

import { opdsProgressionToLocator } from "readium-desktop/renderer/reader/opdsProgression";

const spine = [
    { Href: "chapter-1.xhtml" },
    { Href: "chapter-2.xhtml" },
    { Href: "chapter-3.xhtml" },
    { Href: "chapter-4.xhtml" },
];

describe("OPDS total progression navigation", () => {
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
