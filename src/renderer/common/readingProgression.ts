// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Locator } from "@r2-navigator-js/electron/common/locator";
import type { Publication } from "@r2-shared-js/models/publication";
import { isAudiobookFn, isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { resolveReadiumAnnotationSourceHref } from "readium-desktop/common/readium/annotation/sourceHref";
import {
    getReadiumPositionProgression, mapLocatorToReadiumPosition,
} from "readium-desktop/common/readium/positions";
import type { IReadiumPositionIndex } from "readium-desktop/common/readium/positions";
import type { I18nFunction } from "readium-desktop/common/services/translator";

export function getReadingProgression(
    locator: Locator,
    publication: Publication,
    positionIndex: IReadiumPositionIndex | undefined,
    __: I18nFunction,
): { spineIndex: number; isFixedLayout: boolean; local: string; global: string } | undefined {
    const spine = publication?.Spine;
    if (!locator?.href || !spine?.length || isAudiobookFn(publication) || isDivinaFn(publication) || isPdfFn(publication)) {
        return undefined;
    }
    const href = resolveReadiumAnnotationSourceHref(locator.href, spine.map((link) => link.Href));
    const spineIndex = spine.findIndex((link) => link.Href === href);
    if (spineIndex < 0) {
        return undefined;
    }

    const locations = locator.locations;
    const hasLocalProgression = typeof locations.progression === "number" && Number.isFinite(locations.progression);
    // Legacy saved locators may only contain a local percentage. Map those using the
    // same resource weights as live locators, without constructing the full position list.
    const positionLocator = positionIndex && hasLocalProgression ?
        mapLocatorToReadiumPosition(locator, positionIndex) : locator;
    const position = getReadiumPositionProgression(positionLocator, positionIndex);
    const localProgression = hasLocalProgression ? Math.min(1, Math.max(0, locations.progression)) :
        position ? (position.position - position.firstPosition) / (position.lastPosition - position.firstPosition + 1) : 0;
    const isFixedLayout = (spine[spineIndex].Properties?.Layout || publication.Metadata?.Rendition?.Layout) === "fixed";
    const locatorTotalProgression = typeof locations.totalProgression === "number" && Number.isFinite(locations.totalProgression) ?
        Math.min(1, Math.max(0, locations.totalProgression)) : undefined;
    if (!hasLocalProgression && !position && typeof locatorTotalProgression === "undefined" && !isFixedLayout) {
        return undefined;
    }
    const totalProgression = isFixedLayout ? (spineIndex + 1) / spine.length :
        locatorTotalProgression ?? position?.totalProgression ?? (spineIndex + localProgression) / spine.length;

    const overall = __("publication.progression.overall", { percent: Math.round(totalProgression * 100) });
    const positionLabel = position && !isFixedLayout ? __("publication.progression.position", {
        current: position.position,
        total: position.totalPositions,
    }) : undefined;
    return {
        spineIndex,
        isFixedLayout,
        local: __("publication.progression.chapter", { percent: Math.round(localProgression * 100) }),
        global: `${overall}${positionLabel ? ` (${positionLabel})` : ""}`,
    };
}
