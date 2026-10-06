import { expect, test } from "@jest/globals";

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
