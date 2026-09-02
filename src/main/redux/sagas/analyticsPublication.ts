// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TPublicationUserAnalyticsEventName } from "readium-desktop/common/analytics/publication";
import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";
import { logPublicationEvent } from "readium-desktop/main/analytics/publication";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, spawn as spawnTyped } from "typed-redux-saga/macro";

export function* spawnPublicationAnalyticsEvent(
    name: TPublicationUserAnalyticsEventName,
    params?: TAnalyticsEventParams,
): SagaGenerator<void> {
    yield* spawnTyped(function*() {
        yield* callTyped(logPublicationEvent, name, params);
    });
}
