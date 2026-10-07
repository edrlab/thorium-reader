import { describe, expect, it } from "@jest/globals";
import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { sameReadingLocator } from "readium-desktop/main/tools/readingLocator";

const baseline = {
    href: "chapter.xhtml",
    locations: {
        cfi: "/4/2/12/2",
        cssSelector: ".ulink",
        position: 15,
        progression: 0.21822323462414578,
        totalProgression: 0.14953744595788201,
    },
};

describe("reading locator comparison", () => {
    it("ignores explicitly undefined properties at the root and inside locations", () => {
        const current: MiniLocatorExtended["locator"] = {
            ...baseline,
            title: undefined,
            locations: { ...baseline.locations, caretInfo: undefined },
        };
        expect(sameReadingLocator(baseline, current)).toBe(true);
        expect(sameReadingLocator(current, baseline)).toBe(true);
        expect(Object.hasOwn(current.locations, "caretInfo")).toBe(true);
        expect(Object.hasOwn(baseline.locations, "caretInfo")).toBe(false);
    });

    it("detects navigation to another resource", () => {
        expect(sameReadingLocator(baseline, { ...baseline, href: "other.xhtml" })).toBe(false);
    });

    it("detects navigation within the same resource", () => {
        expect(sameReadingLocator(baseline, {
            ...baseline,
            locations: { ...baseline.locations, progression: 0.5 },
        })).toBe(false);
    });

    it("handles absent locators", () => {
        expect(sameReadingLocator(undefined, undefined)).toBe(true);
        expect(sameReadingLocator(baseline, undefined)).toBe(false);
        expect(sameReadingLocator(undefined, baseline)).toBe(false);
    });
});
