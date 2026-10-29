import { expect, test } from "@jest/globals";
import { JSDOM } from "jsdom";

import { cssFontFamilyName } from "@r2-navigator-js/electron/common/css-font-family";
import { readiumCSSSet } from "@r2-navigator-js/electron/common/readium-css-inject";
import { readiumCSSDefaults } from "@r2-navigator-js/electron/common/readium-css-settings";

test.each([
    ["Inter 18pt", '"Inter 18pt"'],
    ["Calibri", '"Calibri"'],
    ["Times New Roman", '"Times New Roman"'],
    ['A "quoted" font', '"A \\22 quoted\\22  font"'],
    ["A\\B", '"A\\5c B"'],
    ["A\nB", '"A\\a B"'],
])("serializes the installed family name %s", (font, expected) => {
    expect(cssFontFamilyName(font)).toBe(expected);
});

test("applies custom font names and still switches to built-in and publisher fonts", () => {
    const dom = new JSDOM("<!DOCTYPE html><html><head></head><body>Reading text</body></html>");
    try {
        const doc = dom.window.document;
        const apply = (font: string) => readiumCSSSet(doc, {
            urlRoot: "https://example.com",
            setCSS: { ...readiumCSSDefaults, font },
        }, false, false);
        const family = () => doc.documentElement.style.getPropertyValue("--USER__fontFamily");

        apply("Inter 18pt");
        expect(family()).toBe('"Inter 18pt"');
        apply("Calibri");
        expect(family()).toBe('"Calibri"');
        apply("OLD");
        expect(family()).toBe("var(--RS__oldStyleTf)");
        apply("DUO");
        expect(family()).toBe("IA Writer Duospace");
        apply("DEFAULT");
        expect(family()).toBe("");
    } finally {
        dom.window.close();
    }
});
