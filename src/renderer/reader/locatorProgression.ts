// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Locator } from "@r2-navigator-js/electron/common/locator";

export function normalizeLocatorProgressionForPublication(locator: Locator, isDivina: boolean): Locator {
    if (!isDivina) {
        return locator;
    }

    const totalProgression = locator.locations.totalProgression;
    if (typeof totalProgression !== "number" || !Number.isFinite(totalProgression)) {
        return locator;
    }

    return {
        ...locator,
        locations: {
            ...locator.locations,
            // Divina historically exposes its usable page progression as totalProgression.
            progression: Math.min(1, Math.max(0, totalProgression)),
        },
    };
}
