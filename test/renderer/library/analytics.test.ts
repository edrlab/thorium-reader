import { expect, test } from "@jest/globals";

import {
    buildLibraryAppSettingsScreenViewAnalyticsEvent,
    buildLibraryScreenViewAnalyticsEvent,
    resolveLibraryScreenViewAnalyticsScreenName,
} from "readium-desktop/renderer/library/analytics";

test("library route analytics maps top-level routes to screen names", () => {
    expect(resolveLibraryScreenViewAnalyticsScreenName("/")).toBe("HomeView");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/home")).toBe("HomeView");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/library")).toBe("BookshelfView");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/library/search/all")).toBe("BookshelfView");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/opds")).toBe("CatalogsView");
    expect(resolveLibraryScreenViewAnalyticsScreenName("/opds/catalog/browse/1/title/url")).toBe("CatalogsView");
});

test("library route analytics ignores unknown routes", () => {
    expect(resolveLibraryScreenViewAnalyticsScreenName(undefined)).toBeUndefined();
    expect(resolveLibraryScreenViewAnalyticsScreenName("/settings")).toBeUndefined();
});

test("library route analytics builds Measurement Protocol screen_view payloads", () => {
    expect(buildLibraryScreenViewAnalyticsEvent("/opds")).toEqual({
        name: "screen_view",
        params: {
            screen_name: "CatalogsView",
            screen_class: "library",
        },
        screenName: "CatalogsView",
    });

    expect(buildLibraryAppSettingsScreenViewAnalyticsEvent()).toEqual({
        name: "screen_view",
        params: {
            screen_name: "AppSettingsView",
            screen_class: "library",
        },
        screenName: "AppSettingsView",
    });
});
