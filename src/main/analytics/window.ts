// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import {
    buildWindowFocusTimeAnalyticsParams,
    TAnalyticsWindowName,
    windowAnalyticsEvents,
} from "readium-desktop/common/analytics/window";
import { settingsGoogleAnalyticsTelemetryIsEnabled } from "readium-desktop/common/redux/states/settings";
import { diMainGet } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";

import { logMeasurementProtocol } from "./measurementProtocol";

const debug = debug_("readium-desktop:main:analytics:window");

export const logWindowFocusTime = async (
    windowName: TAnalyticsWindowName,
    focusTimeMs: number,
): Promise<void> => {
    try {
        const store = diMainGet("store");
        const state = store.getState() as RootState;

        await logMeasurementProtocol(
            windowAnalyticsEvents.focusTime,
            buildWindowFocusTimeAnalyticsParams(windowName, focusTimeMs),
            {
                clientId: state.analytics.clientId,
                locale: state.i18n.locale,
                disabled: !settingsGoogleAnalyticsTelemetryIsEnabled(state.settings),
            },
        );
    } catch (err) {
        debug("Window focus analytics event failed", windowName, err);
    }
};
