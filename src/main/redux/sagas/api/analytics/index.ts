// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    IAnalyticsApi,
    IAnalyticsLogEventOptions,
    IAnalyticsLogEventResult,
    TAnalyticsEventParams,
} from "readium-desktop/common/api/interface/analyticsApi.interface";
import { logMeasurementProtocol } from "readium-desktop/main/analytics/measurementProtocol";
import { RootState } from "readium-desktop/main/redux/states";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

export function* logEvent(
    name: string,
    params?: TAnalyticsEventParams,
    options?: IAnalyticsLogEventOptions,
): SagaGenerator<IAnalyticsLogEventResult> {

    const clientId = yield* selectTyped((state: RootState) => state.analytics.clientId);
    const locale = yield* selectTyped((state: RootState) => state.i18n.locale);
    return yield* callTyped(logMeasurementProtocol, name, params, {
        ...options,
        clientId,
        locale,
    });
}

export const analyticsApi: IAnalyticsApi = {
    logEvent,
};
