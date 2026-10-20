import { expect, test } from "@jest/globals";
import {
    calculateContentColumns,
    clampPaginatedScrollShift,
    progressionUnitIndex,
} from "@r2-navigator-js/electron/renderer/webview/pagination";

test("trailing body padding does not create a blank third page in the observed layout", () => {
    expect(calculateContentColumns(521, 20, 20, 1, 253)).toBe(2);
    expect(progressionUnitIndex(0.9, 2, false)).toBe(1);
});

test("real overflow remains a page and body zoom applies to content and padding together", () => {
    expect(calculateContentColumns(521, 0, 0, 1, 253)).toBe(3);
    expect(calculateContentColumns(521, 20, 20, 2, 253)).toBe(4);
    expect(calculateContentColumns(521, 20, 20, 1, 0)).toBe(0);
    expect(calculateContentColumns(40, 20, 20, 1, 253)).toBe(1);
});

test("exact and excessive endpoints select the last valid page or odd-column spread", () => {
    expect(progressionUnitIndex(1, 2, false)).toBe(1);
    expect(progressionUnitIndex(1.2, 3, true)).toBe(1);
    expect(progressionUnitIndex(0.99, 5, true)).toBe(2);
    expect(progressionUnitIndex(0.5, 4, true)).toBe(1);
});

test("invalid and beginning progressions stay at the first page", () => {
    expect(progressionUnitIndex(-0.1, 3, false)).toBe(0);
    expect(progressionUnitIndex(NaN, 3, false)).toBe(0);
    expect(progressionUnitIndex(1, 0, true)).toBe(0);
});

test("padding-generated overflow is not a next-page destination", () => {
    expect(clampPaginatedScrollShift(988, 495, 2, false)).toBe(495);
    expect(clampPaginatedScrollShift(988, 495, 1, false)).toBe(0);
});

test("odd-column spreads retain both their physical and adjusted scroll limits", () => {
    expect(clampPaginatedScrollShift(493, 990, 3, true)).toBe(493);
    expect(clampPaginatedScrollShift(990, 990, 3, true)).toBe(990);
});
