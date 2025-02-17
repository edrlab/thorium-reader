import { expect, test } from "@jest/globals";
import { iso8601DurationsToSeconds } from "../../src/utils/iso8601";

test("invalid string must return -1", () => {
    expect(iso8601DurationsToSeconds("")).toBe(-1);
});

test("PT string must return 0", () => {
    expect(iso8601DurationsToSeconds("PT")).toBe(0);
});

test("PT150S string must return 150", () => {
    expect(iso8601DurationsToSeconds("PT150S")).toBe(150);
});

test("PT150 string must return -1", () => {
    expect(iso8601DurationsToSeconds("PT150")).toBe(-1);
});

test("P5Y6M4DT12H30M5S string must return ", () => {
    expect(iso8601DurationsToSeconds("P5Y6M4DT12H30M5S")).toBe(173838605);
});
