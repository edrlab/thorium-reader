// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";

export const readerAnalyticsEvents = {
    search: "reader_search",
    bookmarkToggle: "reader_bookmark_toggle",
    annotate: "reader_annotate",
    paginate: "reader_paginate",
    historyBack: "reader_history_back",
    historyForward: "reader_history_forward",
    prefTheme: "reader_pref_theme",
    prefLayout: "reader_pref_layout",
    prefSave: "reader_pref_save",
    prefApply: "reader_pref_apply",
    prefReset: "reader_pref_reset",
} as const;

export type TReaderAnalyticsEventName =
    typeof readerAnalyticsEvents[keyof typeof readerAnalyticsEvents];

export type TReaderPreferenceAnalyticsLayoutValue = "scrollable" | "paginated";

export const buildReaderPreferenceAnalyticsParams = (
    settingValue: string | number | boolean,
): TAnalyticsEventParams => ({
    setting_value: `${settingValue}`,
});
