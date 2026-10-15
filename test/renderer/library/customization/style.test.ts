import { describe, expect, it } from "@jest/globals";
import { JSDOM } from "jsdom";

import { profileSelectorListTargetsProfileScreen } from "readium-desktop/renderer/library/customization/selectorCssParser";
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

const isSafe = (cssText: string) => profileCssIsSafeAndScoped(cssText, parseCssWithJSDOM);

describe("profile screen style enforcement", () => {
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

    it("accepts an escaped spelling of the profile root", () => {
        expect(isSafe(".custom-profile-\\73 creen { color: black; }")).toBe(true);
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

        expect(profileCssIsSafeAndScoped(".custom-profile-screen {}", failingParser)).toBe(false);
    });
});

describe("profile selector policy", () => {
    const selectorCases: Array<[selector: string, expected: boolean]> = [
        [".custom-profile-screen", true],
        [".custom-profile-\\73 creen", true],
        [".custom-profile-screen.compact:hover", true],
        [".custom-profile-screen[data-label='a>b,+~']", true],
        [".custom-profile-screen:is(.compact, .wide)", true],
        [".custom-profile-screen:has(> .card)", true],
        [".custom-profile-screen::part(content)", true],
        [".custom-profile-screen > section .card", true],
        [".custom-profile-screen .card + .card", true],
        [".custom-profile-screen .card ~ .card", true],
        ["body[data-theme] .custom-profile-screen", true],
        ["body[data-theme='dark'] .custom-profile-screen .card", true],
        ["body[data-theme=light] .custom-profile-screen.compact > .card", true],
        [".custom-profile-screen, .custom-profile-screen .card", true],
        ["", false],
        ["body", false],
        [".other", false],
        ["body .custom-profile-screen", false],
        ["html body[data-theme] .custom-profile-screen", false],
        ["BODY[data-theme] .custom-profile-screen", false],
        ["body[data-other] .custom-profile-screen", false],
        ["body[data-theme^='dark'] .custom-profile-screen", false],
        ["body[data-theme='dark' i] .custom-profile-screen", false],
        ["body[data-theme].compact .custom-profile-screen", false],
        ["*|body[data-theme] .custom-profile-screen", false],
        ["body[*|data-theme] .custom-profile-screen", false],
        ["body[data-theme] > .custom-profile-screen", false],
        ["body[data-theme] + .custom-profile-screen", false],
        [".custom-profile-screen-other", false],
        [".custom-profile-\\73 creen-other", false],
        ["*.custom-profile-screen", false],
        ["#profile.custom-profile-screen", false],
        [".custom-profile-screen + .thorium-content", false],
        [".custom-profile-screen ~ .thorium-content", false],
        [".custom-profile-screen || td", false],
        [".custom-profile-screen, body", false],
        [".custom-profile-screen .card, .outside", false],
        [":is(.custom-profile-screen, body)", false],
        [":where(.custom-profile-screen)", false],
        ["& .custom-profile-screen", false],
        [".custom-profile-screen >", false],
        [".custom-profile-screen[", false],
    ];

    it.each(selectorCases)("validates %s as %s", (selector, expected) => {
        expect(profileSelectorListTargetsProfileScreen(selector)).toBe(expected);
    });
});
