// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// The body's scroll extent includes its padding. Counting that trailing space
// as reading content can create a final column with no publication content.
export function calculateContentColumns(
    scrollExtent: number, paddingBefore: number, paddingAfter: number,
    zoom: number, viewportExtent: number,
): number {
    if (!Number.isFinite(viewportExtent) || viewportExtent <= 0 || !Number.isFinite(scrollExtent)) {
        return 0;
    }
    const padding = (Number.isFinite(paddingBefore) ? paddingBefore : 0) +
        (Number.isFinite(paddingAfter) ? paddingAfter : 0);
    const scale = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
    return Math.max(1, Math.ceil(Math.max(0, scrollExtent - padding) * scale / viewportExtent));
}

export function progressionUnitIndex(progression: number, columns: number, twoPage: boolean): number {
    const units = Number.isFinite(columns) && columns > 0 ?
        Math.max(1, Math.ceil(columns / (twoPage ? 2 : 1))) : 1;
    const ratio = Number.isFinite(progression) ? Math.min(1, Math.max(0, progression)) : 0;
    return Math.min(units - 1, Math.floor(ratio * units));
}

export function clampPaginatedScrollShift(rawShift: number, unitSize: number, columns: number, twoPage: boolean): number {
    if (!Number.isFinite(rawShift) || !Number.isFinite(unitSize) || unitSize <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(rawShift, progressionUnitIndex(1, columns, twoPage) * unitSize));
}
