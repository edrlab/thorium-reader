import { describe, expect, it } from "@jest/globals";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import {
    buildLibraryPageViewParams,
    libraryPageViewFromPathname,
} from "readium-desktop/renderer/library/analytics/pageView";
import { buildProfileCatalogRootIdentifier } from "readium-desktop/renderer/library/customization/route";

const catalogHref = "https://example.com/catalog/root";
const manifest = {
    links: [{ rel: "catalog", href: catalogHref, properties: {} }],
} as unknown as ICustomizationManifest;

describe("Library page_view analytics", () => {
    it("uses a generic Profile Page title and a per-screen deduplication key", () => {
        expect(libraryPageViewFromPathname("/profile/first")).toEqual({
            pageTitle: "Profile Page",
            routeKey: "/profile/first",
        });
        expect(libraryPageViewFromPathname("/profile/second")?.routeKey).not.toBe("/profile/first");
    });

    it("recognizes every route below a manifest catalog without exposing its identity", () => {
        const rootIdentifier = buildProfileCatalogRootIdentifier(catalogHref);
        const pathname = `/opds/${rootIdentifier}/browse/2/title/feed`;

        expect(libraryPageViewFromPathname(pathname, manifest)).toEqual({
            pageTitle: "Profile Catalog",
            routeKey: `Profile Catalog:${rootIdentifier}`,
        });
        expect(buildLibraryPageViewParams("Profile Catalog")).toEqual({
            page_title: "Profile Catalog",
            page_location: "https://desktop.thoriumreader.com/analytics/Profile%20Catalog",
        });
    });

    it("keeps non-profile catalogs generic", () => {
        expect(libraryPageViewFromPathname("/opds/other/browse/1/title/feed", manifest)).toEqual({
            pageTitle: "Catalog",
            routeKey: "Catalog",
        });
    });
});
