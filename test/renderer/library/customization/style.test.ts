import { describe, expect, it } from "@jest/globals";
import { JSDOM } from "jsdom";

import { profileSelectorListTargetsProfileScreenWithCssSelectorParser } from "readium-desktop/renderer/library/customization/selectorCssParser";
import { profileSelectorListTargetsProfileScreenWithCustomParser } from "readium-desktop/renderer/library/customization/selectorCustom";
import { profileSelectorListTargetsProfileScreenWithParsel } from "readium-desktop/renderer/library/customization/selectorParsel";
import {
    profileCssIsSafeAndScoped,
    TProfileCssParser,
} from "readium-desktop/renderer/library/customization/style";

const parseCssWithJSDOM: TProfileCssParser = (cssText) => {
    const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
    const style = dom.window.document.createElement("style");
    style.textContent = cssText;
    dom.window.document.head.appendChild(style);

    if (!style.sheet) {
        throw new Error("CSS parsing failed");
    }

    return style.sheet.cssRules as unknown as CSSRuleList;
};

const selectorValidators = [
    ["custom handwritten parser", profileSelectorListTargetsProfileScreenWithCustomParser],
    ["css-selector-parser", profileSelectorListTargetsProfileScreenWithCssSelectorParser],
    ["parsel-js", profileSelectorListTargetsProfileScreenWithParsel],
] as const;

describe.each(selectorValidators)("profile screen style enforcement with %s", (_name, validateSelector) => {
    const isSafe = (cssText: string) => profileCssIsSafeAndScoped(cssText, parseCssWithJSDOM, validateSelector);

    it("accepts rules rooted at the profile container", () => {
        expect(
            isSafe(`
            .custom-profile-screen { color: black; }
            .custom-profile-screen > section .card:hover { background: white; }
        `),
        ).toBe(true);
    });

    it("accepts complex selector lists without splitting nested commas", () => {
        expect(
            isSafe(`
            .custom-profile-screen:is(.compact, .wide),
            .custom-profile-screen [data-label="first,second"] {
                color: black;
            }
        `),
        ).toBe(true);
    });

    it("accepts theme-qualified rules", () => {
        expect(
            isSafe(`
            body[data-theme] .custom-profile-screen .default-card,
            body[data-theme="dark"] .custom-profile-screen,
            body[data-theme = "sepia"] .custom-profile-screen .card,
            body[data-theme="light"] .custom-profile-screen .card {
                color: black;
            }
        `),
        ).toBe(true);
    });

    it("rejects ancestors other than the supported theme condition", () => {
        expect(isSafe("body .custom-profile-screen { color: red; }")).toBe(false);
        expect(isSafe("body[data-other] .custom-profile-screen { color: red; }")).toBe(false);
        expect(isSafe("html body[data-theme] .custom-profile-screen { color: red; }")).toBe(false);
    });

    it("accepts compound conditions on the profile root", () => {
        expect(isSafe(".custom-profile-screen.compact:hover { color: black; }")).toBe(true);
        expect(isSafe(".custom-profile-screen[data-layout='grid']::before { content: ''; }")).toBe(true);
    });

    it("recursively validates rules inside grouping at-rules", () => {
        expect(
            isSafe(`
            @media (min-width: 400px) {
                @supports (display: grid) {
                    .custom-profile-screen .grid { display: grid; }
                }
            }
        `),
        ).toBe(true);

        expect(
            isSafe(`
            @media (min-width: 400px) {
                .custom-profile-screen .grid { display: grid; }
                body { display: none; }
            }
        `),
        ).toBe(false);
    });

    it("rejects keyframes because animation names are document-global", () => {
        expect(
            isSafe(`
            @keyframes profile-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .custom-profile-screen .card { animation: profile-fade-in 200ms; }
        `),
        ).toBe(false);
    });

    it("rejects unscoped and partially scoped selector lists", () => {
        expect(isSafe("body { color: red; }")).toBe(false);
        expect(isSafe(":root { color: red; }")).toBe(false);
        expect(isSafe(".custom-profile-screen, body { color: red; }")).toBe(false);
        expect(isSafe(".custom-profile-screen .card, .outside { color: red; }")).toBe(false);
    });

    it("rejects selectors that merely contain or resemble the scope", () => {
        expect(isSafe(":is(.custom-profile-screen, body) { color: red; }")).toBe(false);
        expect(isSafe(".custom-profile-screen-other { color: red; }")).toBe(false);
        expect(isSafe("body:has(.custom-profile-screen) { color: red; }")).toBe(false);
    });

    it("rejects sibling combinators that escape the profile container", () => {
        expect(isSafe(".custom-profile-screen + .thorium-content { display: none; }")).toBe(false);
        expect(isSafe(".custom-profile-screen ~ .thorium-content { display: none; }")).toBe(false);
        expect(isSafe(".custom-profile-screen.compact + .thorium-content { display: none; }")).toBe(false);

        expect(isSafe(".custom-profile-screen .card + .card { margin-block-start: 1rem; }")).toBe(true);
    });

    it("rejects external stylesheets, font declarations, and executable CSS values", () => {
        expect(isSafe("@import url(https://example.com/profile.css);")).toBe(false);
        expect(isSafe("@font-face { font-family: Profile; src: url(profile.woff2); }")).toBe(false);
        expect(isSafe(".custom-profile-screen { background: url(javascript:alert(1)); }")).toBe(false);
        expect(isSafe(".custom-profile-screen { width: expression(alert(1)); }")).toBe(false);
    });

    it("rejects unsupported global at-rules", () => {
        expect(isSafe("@page { margin: 0; }")).toBe(false);
    });

    it("fails closed when CSS parsing fails", () => {
        const failingParser: TProfileCssParser = () => {
            throw new Error("Invalid CSS");
        };

        expect(profileCssIsSafeAndScoped(".custom-profile-screen {}", failingParser, validateSelector)).toBe(false);
    });
});

describe("profile selector implementation comparison", () => {
    const sharedCases: Array<[selector: string, expected: boolean]> = [
        [".custom-profile-screen", true],
        [".custom-profile-screen.compact:hover", true],
        [".custom-profile-screen > section .card", true],
        [".custom-profile-screen .card + .card", true],
        ["body[data-theme='dark'] .custom-profile-screen .card", true],
        [".custom-profile-screen, .custom-profile-screen .card", true],
        ["body .custom-profile-screen", false],
        [".custom-profile-screen-other", false],
        [".custom-profile-screen + .thorium-content", false],
        [".custom-profile-screen, body", false],
        [":is(.custom-profile-screen, body)", false],
    ];

    it.each(sharedCases)("returns $expected for %s", (selector, expected) => {
        for (const [_name, validateSelector] of selectorValidators) {
            expect(validateSelector(selector)).toBe(expected);
        }
    });

    it("uses the original handwritten implementation by default", () => {
        const stylesheet = ".custom-profile-\\73 creen {}";

        expect(profileCssIsSafeAndScoped(stylesheet, parseCssWithJSDOM)).toBe(false);
        expect(
            profileCssIsSafeAndScoped(
                stylesheet,
                parseCssWithJSDOM,
                profileSelectorListTargetsProfileScreenWithCssSelectorParser,
            ),
        ).toBe(true);
    });

    it("records parser-specific handling of escaped identifiers", () => {
        const selector = ".custom-profile-\\73 creen";

        // css-selector-parser decodes the escaped `s`. The original scanner
        // compares the raw class spelling, while Parsel treats the space that
        // terminates the escape as a descendant combinator; both fail closed.
        expect(profileSelectorListTargetsProfileScreenWithCustomParser(selector)).toBe(false);
        expect(profileSelectorListTargetsProfileScreenWithCssSelectorParser(selector)).toBe(true);
        expect(profileSelectorListTargetsProfileScreenWithParsel(selector)).toBe(false);
    });

    it("fails closed when a parser does not support a combinator", () => {
        const selector = ".custom-profile-screen || td";

        expect(profileSelectorListTargetsProfileScreenWithCustomParser(selector)).toBe(false);
        expect(profileSelectorListTargetsProfileScreenWithCssSelectorParser(selector)).toBe(false);
        expect(profileSelectorListTargetsProfileScreenWithParsel(selector)).toBe(false);
    });
});
