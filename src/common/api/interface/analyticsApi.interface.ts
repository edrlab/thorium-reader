// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { SagaGenerator } from "typed-redux-saga";

export type TAnalyticsEventParamValue = string | number | boolean;
export type TAnalyticsEventParams = Record<string, TAnalyticsEventParamValue>;
export type TAnalyticsValidationBehavior = "RELAXED" | "ENFORCE_RECOMMENDATIONS";

export interface IAnalyticsLogEventOptions {
    userId?: string;
    timestampMicros?: number;
    sessionId?: number | string;
    engagementTimeMsec?: number;
    debug?: boolean;
    validationBehavior?: TAnalyticsValidationBehavior;
}

export interface IAnalyticsValidationMessage {
    fieldPath?: string;
    description?: string;
    validationCode?: string;
}

export type TAnalyticsLogEventResultReason =
    "disabled" |
    "missing-config" |
    "invalid-event-name" |
    "invalid-url" |
    "network-error";

export interface IAnalyticsLogEventResult {
    sent: boolean;
    isSuccess: boolean;
    statusCode?: number;
    statusMessage?: string;
    reason?: TAnalyticsLogEventResultReason;
    validationMessages?: IAnalyticsValidationMessage[];
}

export interface IAnalyticsApi {
    logEvent: (
        name: string,
        params?: TAnalyticsEventParams,
        options?: IAnalyticsLogEventOptions,
    ) => SagaGenerator<IAnalyticsLogEventResult>;
}

export interface IAnalyticsModuleApi {
    "analytics/logEvent": IAnalyticsApi["logEvent"];
}
