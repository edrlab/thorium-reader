import { describe, expect, it } from "@jest/globals";

import {
    resolveProfileAssetUrl,
    resolveProfileCssUrls,
    resolveProfileSrcset,
} from "readium-desktop/renderer/library/customization/profileResourceUrl";

const screen = "screens/help.html";
const base = "thoriumhttps://host/custom-profile-zip/profile/";
const asset = (path: string) => base + encodeURIComponent(Buffer.from(path).toString("base64"));

describe("profile asset references", () => {
    it("resolves relative, root-relative, encoded and Unicode paths", () => {
        expect(resolveProfileAssetUrl("../images/logo.png", screen, base)).toBe(asset("images/logo.png"));
        expect(resolveProfileAssetUrl("/images/logo.png", screen, base)).toBe(asset("images/logo.png"));
        expect(resolveProfileAssetUrl("../images/caf%C3%A9%20logo.png?v=2#icon", screen, base))
            .toBe(`${asset("images/café logo.png")}?v=2#icon`);
    });

    it("preserves external, data and document-local references", () => {
        for (const url of ["https://example.com/image.png", "//example.com/image.png", "data:image/png;base64,AAAA", "#filter"]) {
            expect(resolveProfileAssetUrl(url, screen, base)).toBe(url);
        }
    });

    it("resolves density and width candidates in img and source srcsets", () => {
        expect(resolveProfileSrcset("../images/small.png 1x, ../images/large.png 2x", screen, base))
            .toBe(`${asset("images/small.png")} 1x, ${asset("images/large.png")} 2x`);
        expect(resolveProfileSrcset("\n../images/small.png 400w,\t../images/large.png 800w", screen, base))
            .toBe(`${asset("images/small.png")} 400w, ${asset("images/large.png")} 800w`);
    });

    it("keeps commas inside URLs and supports candidates without descriptors", () => {
        expect(resolveProfileSrcset("data:image/png;base64,AAAA 1x, ../images/a,b.png 2x", screen, base))
            .toBe(`data:image/png;base64,AAAA 1x, ${asset("images/a,b.png")} 2x`);
        expect(resolveProfileSrcset("../images/a.png, ../images/b.png", screen, base))
            .toBe(`${asset("images/a.png")}, ${asset("images/b.png")}`);
    });

    it("rewrites quoted, unquoted and escaped CSS URLs", () => {
        expect(resolveProfileCssUrls('.custom-profile-screen { background: url(../images/a.png), URL("../images/b(c).png"), url(\'../images/c.png\'); }', screen, base))
            .toBe(`.custom-profile-screen { background: url("${asset("images/a.png")}"), url("${asset("images/b(c).png")}"), url("${asset("images/c.png")}"); }`);
        expect(resolveProfileCssUrls(String.raw`background: url(../images/my\20 logo.png)`, screen, base))
            .toBe(`background: url("${asset("images/my logo.png")}")`);
    });

    it("handles nested CSS functions without changing comments or string content", () => {
        const css = '.custom-profile-screen { background: image-set(url(../images/a.png) 1x); content: "url(../literal.png)"; } /* url(../comment.png) */';
        expect(resolveProfileCssUrls(css, screen, base))
            .toBe(`.custom-profile-screen { background: image-set(url("${asset("images/a.png")}") 1x); content: "url(../literal.png)"; } /* url(../comment.png) */`);
    });

    it("preserves external and fragment CSS URLs", () => {
        const css = "background: url(https://example.com/a.png); filter: url(#filter); mask: url(data:image/png;base64,AAAA)";
        expect(resolveProfileCssUrls(css, screen, base)).toBe(css);
    });
});
