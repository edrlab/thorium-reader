// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";

export type TLibraryPageTitle = "Home" | "Bookshelf" | "Catalog";

export type TLibraryPageViewParams = TAnalyticsEventParams & {
    page_title: TLibraryPageTitle;
    page_location: string;
};

const PAGE_LOCATION_ORIGIN = "https://desktop.thoriumreader.com/analytics";

export const libraryPageTitleFromPathname = (pathname: string): TLibraryPageTitle | undefined => {
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/";

    if (normalizedPathname === "/" || normalizedPathname === "/home") {
        return "Home";
    }

    if (normalizedPathname === "/library") {
        return "Bookshelf";
    }

    if (normalizedPathname === "/opds" || normalizedPathname.startsWith("/opds/")) {
        return "Catalog";
    }

    return undefined;
};

export const buildLibraryPageViewParams = (
    pageTitle: TLibraryPageTitle,
): TLibraryPageViewParams => ({
    page_title: pageTitle,
    page_location: `${PAGE_LOCATION_ORIGIN}/${pageTitle}`,
});
