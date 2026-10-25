import { expect, jest, test } from "@jest/globals";
import { buildOpdsBrowserRoute, parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";

jest.mock("readium-desktop/renderer/library/routing", () => ({ routes: {} }));

test.each(["https://example.org/catalog", "opds://example.org/catalog", "apiapp://123:apiapp:https://example.org"])(
    "preserves supported catalog URLs: %s", (url) => {
        expect(parseOpdsBrowserRoute(buildOpdsBrowserRoute("catalog", "Books", url))).toEqual({
            rootFeedIdentifier: "catalog", title: "Books", url, level: 1,
        });
    },
);

test.each([undefined, "undefined", "null", "", "/relative"])("rejects missing or invalid URL %s", (url) => {
    expect(parseOpdsBrowserRoute(buildOpdsBrowserRoute("catalog", "Books", url))).toBeUndefined();
});

test("allows an untitled feed", () => {
    expect(parseOpdsBrowserRoute(buildOpdsBrowserRoute("catalog", "", "https://example.org"))?.title).toBe("");
});

test.each(["/opds/catalog/browse/1/QQ/a", "/opds/catalog/browse/1/_w/aHR0cHM6Ly9leGFtcGxlLm9yZw", "/opds/catalog/browse"])(
    "rejects malformed routes without throwing: %s", (route) => {
        expect(parseOpdsBrowserRoute(route)).toBeUndefined();
    },
);
