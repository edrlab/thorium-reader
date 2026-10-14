// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";

import { opdsProgressionIsNewer } from "readium-desktop/common/models/opdsProgression";

describe("OPDS progression timestamps", () => {
    it("accepts a valid remote timestamp when no local locator exists", () => {
        expect(opdsProgressionIsNewer("2026-09-30T10:00:00Z", undefined)).toBe(true);
    });

    it("requires the remote timestamp to be strictly newer", () => {
        const local = Date.parse("2026-09-30T10:00:00Z");
        expect(opdsProgressionIsNewer("2026-09-30T10:00:00Z", local)).toBe(false);
        expect(opdsProgressionIsNewer("2026-09-30T09:59:59Z", local)).toBe(false);
        expect(opdsProgressionIsNewer("2026-09-30T10:00:01Z", local)).toBe(true);
    });

    it("rejects an invalid remote timestamp", () => {
        expect(opdsProgressionIsNewer("not-a-date", undefined)).toBe(false);
    });
});
