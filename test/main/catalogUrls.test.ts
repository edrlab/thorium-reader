import { describe, expect, it } from "@jest/globals";
import { getCatalogUrls } from "readium-desktop/main/catalogUrls";

describe("badge catalog URLs", () => {
    const main = "https://example.com/catalog";
    const bookshelf = "https://example.com/shelf?user=123&lang=en";

    it("keeps the main catalog and bookshelf login endpoint", () => {
        expect(getCatalogUrls(new URLSearchParams({ main, bookshelf }))).toEqual({
            url: main, authenticationUrl: bookshelf,
        });
    });

    it("accepts a bookshelf without a main catalog", () => {
        expect(getCatalogUrls(new URLSearchParams({ bookshelf }))).toEqual({
            url: bookshelf, authenticationUrl: bookshelf,
        });
    });

    it("keeps main-only badges working", () => {
        expect(getCatalogUrls(new URLSearchParams({ main }))).toEqual({ url: main });
    });

    it.each(["", "not a URL", "file:///tmp/shelf", "javascript:alert(1)"])(
        "rejects an invalid bookshelf: %s", (value) => {
            expect(() => getCatalogUrls(new URLSearchParams({ bookshelf: value }))).toThrow();
            if (value) {
                expect(() => getCatalogUrls(new URLSearchParams({ main, bookshelf: value }))).toThrow();
            }
        },
    );
});
