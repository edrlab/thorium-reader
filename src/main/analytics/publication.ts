// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import {
    buildPublicationAnalyticsParams,
    TPublicationAnalyticsEventName,
    TPublicationUserAnalyticsEventName,
} from "readium-desktop/common/analytics/publication";
import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";
import { diMainGet } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";

import { logMeasurementProtocol } from "./measurementProtocol";
import { PublicationView } from "readium-desktop/common/views/publication";

const debug = debug_("readium-desktop:main:analytics:publication");

const logPublicationEvent_ = async (
    name: string,
    params?: TAnalyticsEventParams,
): Promise<void> => {
    const store = diMainGet("store");
    const state = store.getState() as RootState;

    await logMeasurementProtocol(name, params, {
        clientId: state.analytics.clientId,
        locale: state.i18n.locale,
    });
};

export const logPublicationMeasurement = async (
    name: TPublicationAnalyticsEventName,
    publication: PublicationView,
): Promise<void> => {
    try {
        await logPublicationEvent_(name, buildPublicationAnalyticsParams(publication));
    } catch (err) {
        debug("Publication analytics event failed", name, err);
    }
};

export const logPublicationEvent = async (
    name: TPublicationUserAnalyticsEventName,
    params?: TAnalyticsEventParams,
): Promise<void> => {
    try {
        await logPublicationEvent_(name, params);
    } catch (err) {
        debug("Publication analytics event failed", name, err);
    }
};
