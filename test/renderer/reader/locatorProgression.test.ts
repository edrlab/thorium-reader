import { expect, test } from "@jest/globals";

import { Link } from "@r2-shared-js/models/publication-link";
import { getReadingLocationProgression } from "readium-desktop/renderer/common/readingLocation";
import { normalizeLocatorProgressionForPublication } from "readium-desktop/renderer/reader/locatorProgression";

const locator = {
    href: "chapter.xhtml",
    locations: {
        position: 86,
        progression: 0.5,
        totalProgression: 0.13,
    },
};

test("preserves EPUB resource progression when total progression is also present", () => {
    const normalized = normalizeLocatorProgressionForPublication(locator, false);

    expect(normalized.locations.progression).toBe(0.5);
    expect(normalized.locations.totalProgression).toBe(0.13);
});

test("projects Divina total progression into its page progression", () => {
    const normalized = normalizeLocatorProgressionForPublication(locator, true);

    expect(normalized.locations.progression).toBe(0.13);
    expect(normalized.locations.totalProgression).toBe(0.13);
    expect(locator.locations.progression).toBe(0.5);
});

test("reports book progress separately from scroll progress in the current EPUB resource", () => {
    const spine = ["intro.xhtml", "chapter.xhtml"].map((href) => Object.assign(new Link(), { Href: href }));
    const positionIndex = {
        total: 100,
        resources: [
            { href: "intro.xhtml", firstPosition: 1, positionCount: 96 },
            { href: "chapter.xhtml", firstPosition: 97, positionCount: 4 },
        ],
    };

    expect(getReadingLocationProgression({
        href: "chapter.xhtml#conclusion",
        locations: { progression: 0.02, position: 97, totalProgression: 0.9608 },
    }, spine, positionIndex)).toEqual({ spineIndex: 1, local: 0.02, total: 0.9608 });

    expect(getReadingLocationProgression({
        href: "chapter.xhtml",
        locations: { position: 98 },
    }, spine, positionIndex)).toEqual({ spineIndex: 1, local: 0.25, total: 0.97 });

    expect(getReadingLocationProgression({
        href: "chapter.xhtml",
        locations: { progression: 0.5, position: 1 },
    }, spine, positionIndex)).toEqual({ spineIndex: 1, local: 0.5, total: 0.75 });
});
