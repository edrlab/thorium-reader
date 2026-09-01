// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";

export const screenAnalyticsEvents = {
    view: "screen_view",
} as const;

export type TScreenAnalyticsEventName =
    typeof screenAnalyticsEvents[keyof typeof screenAnalyticsEvents];

export type TScreenViewAnalyticsScreenName =
    "HomeView" |
    "BookshelfView" |
    "CatalogsView" |
    "AppSettingsView" |
    "ReaderView";

export type TScreenViewAnalyticsScreenClass =
    "library" |
    "reader";

export const buildScreenViewAnalyticsParams = (
    screenName: TScreenViewAnalyticsScreenName,
    screenClass: TScreenViewAnalyticsScreenClass,
): TAnalyticsEventParams => ({
    screen_name: screenName,
    screen_class: screenClass,
});
