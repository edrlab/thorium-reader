// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";
import {
    buildScreenViewAnalyticsParams,
    screenAnalyticsEvents,
    TScreenViewAnalyticsScreenName,
} from "readium-desktop/common/analytics/screen";

export interface ILibraryScreenViewAnalyticsEvent {
    name: typeof screenAnalyticsEvents.view;
    params: TAnalyticsEventParams;
    screenName: TScreenViewAnalyticsScreenName;
}

export const resolveLibraryScreenViewAnalyticsScreenName = (
    pathname: string | undefined,
): TScreenViewAnalyticsScreenName | undefined => {

    if (!pathname) {
        return undefined;
    }

    if (pathname === "/" || pathname === "/home") {
        return "home";
    }

    if (pathname === "/library" || pathname.startsWith("/library/")) {
        return "library";
    }

    if (pathname === "/opds" || pathname.startsWith("/opds/")) {
        return "catalog";
    }

    return undefined;
};

export const buildLibraryScreenViewAnalyticsEvent = (
    pathname: string | undefined,
): ILibraryScreenViewAnalyticsEvent | undefined => {

    const screenName = resolveLibraryScreenViewAnalyticsScreenName(pathname);
    if (!screenName) {
        return undefined;
    }

    return {
        name: screenAnalyticsEvents.view,
        params: buildScreenViewAnalyticsParams(screenName),
        screenName,
    };
};
