import { expect, test } from "@jest/globals";

import {
    normalizeEpubResourceHref,
    resolveReadiumAnnotationSourceHref,
} from "readium-desktop/common/readium/annotation/sourceHref";

test("EPUB href normalization decodes percent-encoded paths", () => {
    expect(normalizeEpubResourceHref("OPS/Text/Chapter%201.xhtml")).toBe("OPS/Text/Chapter 1.xhtml");
});

test("Readium annotation source href resolver keeps exact spine hrefs", () => {
    expect(resolveReadiumAnnotationSourceHref("OPS/Text/chapter.xhtml", ["OPS/Text/chapter.xhtml"])).toBe(
        "OPS/Text/chapter.xhtml",
    );
});

test("Readium annotation source href resolver ignores source fragments and query params", () => {
    expect(resolveReadiumAnnotationSourceHref("OPS/Text/chapter.xhtml?utm=test#p1", ["OPS/Text/chapter.xhtml"])).toBe(
        "OPS/Text/chapter.xhtml",
    );
});

test("Readium annotation source href resolver matches percent encoded and decoded hrefs", () => {
    expect(
        resolveReadiumAnnotationSourceHref("OPS/Text/Chapter%201.xhtml#selection", ["OPS/Text/Chapter 1.xhtml"]),
    ).toBe("OPS/Text/Chapter 1.xhtml");

    expect(resolveReadiumAnnotationSourceHref("OPS/Text/Chapter 1.xhtml", ["OPS/Text/Chapter%201.xhtml"])).toBe(
        "OPS/Text/Chapter%201.xhtml",
    );
});

test("Readium annotation source href resolver matches unique suffixes", () => {
    expect(
        resolveReadiumAnnotationSourceHref("https://example.org/pub/OPS/Text/chapter.xhtml#p1", [
            "OPS/Text/chapter.xhtml",
        ]),
    ).toBe("OPS/Text/chapter.xhtml");

    expect(resolveReadiumAnnotationSourceHref("./Text/../Text/chapter.xhtml", ["OPS/Text/chapter.xhtml"])).toBe(
        "OPS/Text/chapter.xhtml",
    );
});

test("Readium annotation source href resolver rejects ambiguous suffixes", () => {
    expect(
        resolveReadiumAnnotationSourceHref("chapter.xhtml", ["OPS/Text/chapter.xhtml", "OPS/Appendix/chapter.xhtml"]),
    ).toBeUndefined();
});

test("Readium annotation source href resolver rejects unrelated sources", () => {
    expect(resolveReadiumAnnotationSourceHref("OPS/Text/missing.xhtml", ["OPS/Text/chapter.xhtml"])).toBeUndefined();
});
