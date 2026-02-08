// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IRange { begin: number; end: number; }

export function parseRangeHeader(rangeHeader: undefined | string | string[]): IRange[] {
    let ranges: IRange[] = [];

    if (!rangeHeader) {
        return ranges;
    }

    let rHeader: string[];
    if (rangeHeader instanceof Array) {
        rHeader = rangeHeader as string[];
    } else { // typeof rangeHeader === "string"
        rHeader = [rangeHeader] as string[];
    }

    rHeader.forEach((rh) => {
        const arr = parseRangeHeader_(rh);
        ranges = ranges.concat(arr);
    });

    return ranges;
}

function parseRangeHeader_(rangeHeader: string): IRange[] {
    const ranges: IRange[] = [];
    const iEqual = rangeHeader.indexOf("=");
    if (iEqual <= 0) {
        return ranges;
    }
    // const rangeType = rangeHeader.substr(0, iEqual); // assumes "bytes"
    const rangesStr = rangeHeader.substr(iEqual + 1); // multi-ranges?
    const rangeStrArray = rangesStr.split(",");
    rangeStrArray.forEach((rangeStr) => {
        // can be "-END", "BEGIN-" or "BEGIN-END"
        const beginEndArray = rangeStr.split("-");
        const beginStr = beginEndArray[0];
        const endStr = beginEndArray[1];
        let begin = -1;
        if (beginStr && beginStr.length) {
            begin = parseInt(beginStr, 10);
        }
        let end = -1;
        if (endStr && endStr.length) {
            end = parseInt(endStr, 10);
        }

        const rangeObj: IRange = { begin, end };
        ranges.push(rangeObj);
    });

    return ranges;
}

export function combineRanges(ranges: IRange[]): IRange[] {

    const orderedRanges = ranges
        .map((range, index) => {
            return {
                begin: range.begin,
                end: range.end,
                index,
            };
        })
        .sort((a, b) => {
            return a.begin - b.begin;
        });

    let j = 0;
    let i = 1;
    for (j = 0, i = 1; i < orderedRanges.length; i++) {
        const orderedRange = orderedRanges[i];
        const currentRange = orderedRanges[j];

        if (orderedRange.begin > currentRange.end + 1) {
            orderedRanges[++j] = orderedRange;
        } else if (orderedRange.end > currentRange.end) {
            currentRange.end = orderedRange.end;
            currentRange.index = Math.min(currentRange.index, orderedRange.index);
        }
    }

    orderedRanges.length = j + 1;

    return orderedRanges
        .sort((a, b) => {
            return a.index - b.index;
        })
        .map((range) => {
            return {
                begin: range.begin,
                end: range.end,
            };
        });
}
