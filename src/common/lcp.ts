// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { LcpInfo, LsdStatus } from "readium-desktop/common/models/lcp";

// Safeguard / sanity check to prevent native LCP lib crash (uncaught exception in NodeJS)
// https://readium.org/lcp-specs/releases/lcp/latest.html#33-core-license-information
// TOOD: moving this to LCP.init() wouldn't help
// as we need to capture this error early in the application logical layer / data flow
export function lcpLicenseIsNotWellFormed(lcpJson: any): boolean {
    // lcpJson.updated is optional
    // obviously, we could also check deeper inner object properties,
    // but this surface object shape check is sufficient to capture HTTP 500 JSON response body, etc.
    return !lcpJson.id ||
        !lcpJson.provider ||
        !lcpJson.issued ||
        !lcpJson.encryption ||
        !lcpJson.links ||
        !lcpJson.signature;
}

export function lcpLsdStatusIsNoLongerUsable(lsdStatus: Pick<LsdStatus, "status"> | undefined): boolean {
    return lsdStatus?.status === StatusEnum.Expired ||
        lsdStatus?.status === StatusEnum.Revoked ||
        lsdStatus?.status === StatusEnum.Returned ||
        lsdStatus?.status === StatusEnum.Cancelled;
}

export function lcpInfoHasConfirmedNoLongerUsableStatus(lcp: Pick<LcpInfo, "lsd"> | undefined): boolean {
    return lcpLsdStatusIsNoLongerUsable(lcp?.lsd?.lsdStatus);
}

export function lcpRightsEndIsExpired(rightsEndIso: string | undefined, nowMs = Date.now()): boolean {
    if (!rightsEndIso) {
        return false;
    }

    const rightsEndMs = Date.parse(rightsEndIso);
    return !Number.isNaN(rightsEndMs) && rightsEndMs <= nowMs;
}

export function lcpInfoIsNoLongerUsable(lcp: Pick<LcpInfo, "lsd" | "rights"> | undefined, nowMs = Date.now()): boolean {
    // Broad local usability check. Automatic shared-computer deletion should prefer
    // lcpInfoHasConfirmedNoLongerUsableStatus() unless a user-initiated flow explicitly accepts
    // the local rights.end fallback.
    return lcpLsdStatusIsNoLongerUsable(lcp?.lsd?.lsdStatus) ||
        lcpRightsEndIsExpired(lcp?.rights?.end, nowMs);
}
