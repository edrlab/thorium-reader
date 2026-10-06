import { describe, expect, it } from "@jest/globals";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import {
    buildProfileRoute,
    decodeProfileRouteParam,
    getLocalizedProfileScreenLinks,
    resolveProfileScreenLink,
} from "readium-desktop/renderer/library/customization/route";

const manifest = {
    links: [
        { rel: "screen", href: "./faq-en.html", type: "text/html", language: "en", properties: {} },
        { rel: "screen", href: "./faq-fr.html", type: "text/html", language: "fr", properties: {} },
        { rel: "screen", href: "./neutral.html", type: "text/html", properties: {} },
        { rel: "screen", href: "./ignored.xhtml", type: "application/xhtml+xml", language: "fr", properties: {} },
    ],
} as unknown as ICustomizationManifest;

describe("profile screen routes", () => {
    it("builds a URL-safe /profile route and decodes it", () => {
        const route = buildProfileRoute("./écran/faq.html?x=1");
        const screenId = route.replace("/profile/", "");

        expect(route.startsWith("/profile/")).toBe(true);
        expect(screenId).not.toMatch(/[+/=]/);
        expect(decodeProfileRouteParam(screenId)).toBe("./écran/faq.html?x=1");
    });

    it("does not throw for a malformed route parameter", () => {
        expect(decodeProfileRouteParam("%%%invalid%%%")).toBeUndefined();
    });

    it("selects exact-language screens before the English and neutral fallback", () => {
        expect(getLocalizedProfileScreenLinks(manifest, "fr").map(({ href }) => href)).toEqual(["./faq-fr.html"]);
        expect(getLocalizedProfileScreenLinks(manifest, "es").map(({ href }) => href)).toEqual([
            "./faq-en.html",
            "./neutral.html",
        ]);
    });

    it("only resolves a screen from the localized manifest allow-list", () => {
        const frenchId = buildProfileRoute("./faq-fr.html").replace("/profile/", "");
        const englishId = buildProfileRoute("./faq-en.html").replace("/profile/", "");

        expect(resolveProfileScreenLink(manifest, "fr", frenchId)?.href).toBe("./faq-fr.html");
        expect(resolveProfileScreenLink(manifest, "fr", englishId)).toBeUndefined();
    });
});
