// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { isDeepStrictEqual } from "node:util";
import { limitLocatorText } from "readium-desktop/common/redux/states/locatorInitialState";
import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

type ReadingLocator = MiniLocatorExtended["locator"] | undefined;

// Apply the same text cap and JSON representation used when saving a locator.
// Resaving a legacy locator with longer excerpts does not count as movement.
const normalizeLocatorForComparison = (locator: ReadingLocator): unknown =>
    locator ? JSON.parse(JSON.stringify(limitLocatorText(locator))) : undefined;

export const sameReadingLocator = (baseline: ReadingLocator, current: ReadingLocator): boolean =>
    isDeepStrictEqual(normalizeLocatorForComparison(baseline), normalizeLocatorForComparison(current));
