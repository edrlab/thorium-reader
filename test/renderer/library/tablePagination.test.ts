import { expect, test } from "@jest/globals";
import { getNextPageIndex } from "../../../src/renderer/library/components/searchResult/tablePagination";

test("resets to the first page when search, filter, or sort criteria change", () => {
    expect(getNextPageIndex(2, 4, true)).toBe(0);
});

test("keeps a valid page index when publication data changes", () => {
    expect(getNextPageIndex(2, 4, false)).toBe(2);
});

test("clamps the page index when the result set loses pages", () => {
    expect(getNextPageIndex(3, 2, false)).toBe(1);
});

test("uses the first page when the result set is empty", () => {
    expect(getNextPageIndex(3, 0, false)).toBe(0);
});
