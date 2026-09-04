// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";

export const catalogAnalyticsEvents = {
    add: "catalog_add",
    remove: "catalog_remove",
    edit: "catalog_edit",
    favorite: "catalog_favorite",
    browse: "catalog_browse",
} as const;

export type TCatalogAnalyticsEventName =
    typeof catalogAnalyticsEvents[keyof typeof catalogAnalyticsEvents];

export type TCatalogAddAnalyticsOrigin =
    "manual" |
    "deeplink" |
    "pnb" |
    "registry";

export const buildCatalogAddAnalyticsParams = (
    origin: TCatalogAddAnalyticsOrigin,
): TAnalyticsEventParams => ({
    origin,
});
