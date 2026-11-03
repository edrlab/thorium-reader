// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Locator } from "@r2-navigator-js/electron/common/locator";
import type { Link } from "@r2-shared-js/models/publication-link";
import { resolveReadiumAnnotationSourceHref } from "readium-desktop/common/readium/annotation/sourceHref";
import { getReadiumPositionProgression, type IReadiumPositionIndex } from "readium-desktop/common/readium/positions";

export function getReadingLocationProgression(locator: Locator, spine: Link[], positionIndex?: IReadiumPositionIndex) {
    const href = resolveReadiumAnnotationSourceHref(locator.href, spine.map((link) => link.Href));
    const spineIndex = spine.findIndex((link) => link.Href === href);
    if (spineIndex < 0) {
        return undefined;
    }

    const position = getReadiumPositionProgression(locator, positionIndex, href);
    const { progression, totalProgression } = locator.locations;
    const local = typeof progression === "number" && Number.isFinite(progression) ?
        Math.min(1, Math.max(0, progression)) :
        position ? (position.position - position.firstPosition) / (position.lastPosition - position.firstPosition + 1) : 0;
    const total = position?.totalProgression ??
        (typeof totalProgression === "number" && Number.isFinite(totalProgression) ?
            Math.min(1, Math.max(0, totalProgression)) : (spineIndex + local) / spine.length);

    return { spineIndex, local, total };
}
