// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";
import {
    buildLcpPassphraseAnalyticsParams,
    lcpAnalyticsEvents,
    TLcpAnalyticsEventName,
    TLcpPassphraseAnalyticsValue,
} from "readium-desktop/common/analytics/lcp";
import { settingsGoogleAnalyticsTelemetryIsEnabled } from "readium-desktop/common/redux/states/settings";
import { diMainGet } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";

import { logMeasurementProtocol } from "./measurementProtocol";

const debug = debug_("readium-desktop:main:analytics:lcp");

export const logLcpEvent = async (
    name: TLcpAnalyticsEventName,
    params?: TAnalyticsEventParams,
): Promise<void> => {
    try {
        const store = diMainGet("store");
        const state = store.getState() as RootState;

        await logMeasurementProtocol(name, params, {
            clientId: state.analytics.clientId,
            locale: state.i18n.locale,
            disabled: !settingsGoogleAnalyticsTelemetryIsEnabled(state.settings),
        });
    } catch (err) {
        debug("LCP analytics event failed", name, err);
    }
};

export const logLcpPassphrase = async (
    value: TLcpPassphraseAnalyticsValue,
): Promise<void> => {
    await logLcpEvent(
        lcpAnalyticsEvents.passphrase,
        buildLcpPassphraseAnalyticsParams(value),
    );
};
