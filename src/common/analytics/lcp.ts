// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";

export const lcpAnalyticsEvents = {
    dialog: "lcp_dialog",
    passphrase: "lcp_passphrase",
    help: "lcp_help",
} as const;

export type TLcpAnalyticsEventName =
    typeof lcpAnalyticsEvents[keyof typeof lcpAnalyticsEvents];

export type TLcpPassphraseAnalyticsValue = "valid" | "invalid" | "discovered";

export const buildLcpPassphraseAnalyticsParams = (
    value: TLcpPassphraseAnalyticsValue,
): TAnalyticsEventParams => ({
    value,
});
