import { expect, test } from "@jest/globals";

import {
    buildLibraryScreenViewAnalyticsEvent,
    resolveLibraryScreenViewAnalyticsScreenName,
} from "readium-desktop/renderer/library/analytics";

test("library route analytics maps top-level routes to screen names", () => {
    expect(resolveLibraryScreenViewAnalyticsScreenName("/")).toBe("home");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/home")).toBe("home");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/library")).toBe("library");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/library/search/all")).toBe("library");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/opds")).toBe("catalog");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/opds/catalog/browse/1/title/url")).toBe("catalog");
});

test("library route analytics ignores unknown routes", () => {
    expect(resolveLibraryScreenViewAnalyticsScreenName(undefined)).toBeUndefined();
    expect(resolveLibraryScreenViewAnalyticsScreenName("/settings")).toBeUndefined();
});

test("library route analytics builds Measurement Protocol screen_view payloads", () => {
    expect(buildLibraryScreenViewAnalyticsEvent("/opds")).toEqual({
        name: "screen_view",
        params: {
            screen_name: "catalog",
            screen_class: "Catalog",
        },
        screenName: "catalog",
    });
});
