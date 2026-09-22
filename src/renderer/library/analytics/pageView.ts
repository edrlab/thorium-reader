// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";
import { isProfileCatalogPathname } from "readium-desktop/renderer/library/customization/route";

export type TLibraryPageTitle = "Home" | "Bookshelf" | "Catalog" | "Profile Page" | "Profile Catalog";

export interface ILibraryPageView {
    pageTitle: TLibraryPageTitle;
    routeKey: string;
}

export type TLibraryPageViewParams = TAnalyticsEventParams & {
    page_title: TLibraryPageTitle;
    page_location: string;
};

const PAGE_LOCATION_ORIGIN = "https://desktop.thoriumreader.com/analytics";

export const libraryPageViewFromPathname = (
    pathname: string,
    customizationManifest?: ICustomizationManifest,
): ILibraryPageView | undefined => {
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/";

    if (normalizedPathname === "/" || normalizedPathname === "/home") {
        return { pageTitle: "Home", routeKey: "Home" };
    }

    if (normalizedPathname === "/library") {
        return { pageTitle: "Bookshelf", routeKey: "Bookshelf" };
    }

    if (/^\/profile\/[^/]+$/.test(normalizedPathname)) {
        return { pageTitle: "Profile Page", routeKey: normalizedPathname };
    }

    if (normalizedPathname === "/opds" || normalizedPathname.startsWith("/opds/")) {
        if (isProfileCatalogPathname(normalizedPathname, customizationManifest)) {
            const rootIdentifier = normalizedPathname.split("/")[2];
            return {
                pageTitle: "Profile Catalog",
                routeKey: `Profile Catalog:${rootIdentifier}`,
            };
        }
        return { pageTitle: "Catalog", routeKey: "Catalog" };
    }

    return undefined;
};

export const libraryPageTitleFromPathname = (
    pathname: string,
    customizationManifest?: ICustomizationManifest,
): TLibraryPageTitle | undefined =>
    libraryPageViewFromPathname(pathname, customizationManifest)?.pageTitle;

export const buildLibraryPageViewParams = (
    pageTitle: TLibraryPageTitle,
): TLibraryPageViewParams => ({
    page_title: pageTitle,
    page_location: `${PAGE_LOCATION_ORIGIN}/${encodeURIComponent(pageTitle)}`,
});
