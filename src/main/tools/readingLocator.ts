// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { isDeepStrictEqual } from "node:util";
import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

type ReadingLocator = MiniLocatorExtended["locator"] | undefined;

// Persisted locators are JSON: absent and explicitly undefined properties
// represent the same reading location after serialization.
const normalizeLocatorForComparison = (locator: ReadingLocator): unknown =>
    locator ? JSON.parse(JSON.stringify(locator)) : undefined;

export const sameReadingLocator = (baseline: ReadingLocator, current: ReadingLocator): boolean =>
    isDeepStrictEqual(normalizeLocatorForComparison(baseline), normalizeLocatorForComparison(current));
