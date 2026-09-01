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
} from "readium-desktop/common/analytics/screen";

export interface IReaderScreenViewAnalyticsEvent {
    name: typeof screenAnalyticsEvents.view;
    params: TAnalyticsEventParams;
    screenName: "ReaderView";
}

export const buildReaderScreenViewAnalyticsEvent = (): IReaderScreenViewAnalyticsEvent => ({
    name: screenAnalyticsEvents.view,
    params: buildScreenViewAnalyticsParams("ReaderView", "reader"),
    screenName: "ReaderView",
});
