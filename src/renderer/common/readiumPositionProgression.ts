// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IReadiumPositionProgression } from "readium-desktop/common/readium/positions";
import type { I18nFunction } from "readium-desktop/common/services/translator";

export interface IReadiumResourceProgression {
    progression: number;
    resource: number;
    title?: string;
    totalResources: number;
}

export function formatReadiumResourceProgression(
    __: I18nFunction,
    progression: IReadiumResourceProgression,
): string {
    return __("publication.progression.resourceOfTotal", {
        progression: `${Math.round(progression.progression * 100)}`,
        resource: `${progression.resource}`,
        title: progression.title ? ` (${progression.title})` : "",
        total: `${progression.totalResources}`,
    });
}

export function formatReadiumPositionProgression(
    __: I18nFunction,
    progression: IReadiumPositionProgression,
): string {
    return __("publication.progression.positionOfTotal", {
        first: `${progression.firstPosition}`,
        last: `${progression.lastPosition}`,
        position: `${progression.position}`,
        progression: `${Math.round(progression.totalProgression * 100)}`,
        total: `${progression.totalPositions}`,
    });
}

export function formatReadiumFooterPositionProgression(
    __: I18nFunction,
    progression: IReadiumPositionProgression,
): string {
    return __("publication.progression.footerPositionOfTotal", {
        first: `${progression.firstPosition}`,
        last: `${progression.lastPosition}`,
        position: `${progression.position}`,
        progression: `${Math.round(progression.totalProgression * 100)}`,
        total: `${progression.totalPositions}`,
    });
}
