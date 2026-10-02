// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";

export const windowAnalyticsEvents = {
    focusTime: "window_focus_time",
} as const;

export type TWindowAnalyticsEventName =
    typeof windowAnalyticsEvents[keyof typeof windowAnalyticsEvents];

export type TAnalyticsWindowName = "library" | "reader";

export const buildWindowFocusTimeAnalyticsParams = (
    windowName: TAnalyticsWindowName,
    focusTimeMs: number,
): TAnalyticsEventParams => ({
    window_name: windowName,
    focus_time_ms: focusTimeMs,
});
