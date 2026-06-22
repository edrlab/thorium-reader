import { expect, test } from "@jest/globals";

import {
    clamp,
    clientRectToPageViewportRect,
    clientRectToPdfRect,
    findBestPageForRect,
    isUsableSelectionRect,
    normalizePdfRect,
    pageViewportRectToPdfRect,
    rectHeight,
    rectIntersectionArea,
    rectWidth,
} from "../../../../../src/renderer/reader/pdf/webview/annotationGeometry";

test("rect width uses the explicit width when the browser provides it", () => {
    expect(rectWidth({
        left: 10,
        top: 0,
        right: 40,
        bottom: 10,
        width: 12.5,
    })).toBe(12.5);
});

test("rect width is derived from coordinates when width is absent", () => {
    expect(rectWidth({
        left: 10,
        top: 0,
        right: 40,
        bottom: 10,
    })).toBe(30);
});

test("rect height uses the explicit height when the browser provides it", () => {
    expect(rectHeight({
        left: 0,
        top: 5,
        right: 10,
        bottom: 25,
        height: 9.25,
    })).toBe(9.25);
});

test("rect height is derived from coordinates when height is absent", () => {
    expect(rectHeight({
        left: 0,
        top: 5,
        right: 10,
        bottom: 25,
    })).toBe(20);
});

test("selection rectangles must be at least one CSS pixel wide and high", () => {
    expect(isUsableSelectionRect({
        left: 0,
        top: 0,
        right: 10,
        bottom: 10,
        width: 10,
        height: 10,
    })).toBe(true);

    expect(isUsableSelectionRect({
        left: 0,
        top: 0,
        right: 10,
        bottom: 0.5,
        width: 10,
        height: 0.5,
    })).toBe(false);
});

test("selection rectangle usability supports a custom minimum size", () => {
    expect(isUsableSelectionRect({
        left: 0,
        top: 0,
        right: 10,
        bottom: 10,
        width: 5,
        height: 5,
    }, 5)).toBe(true);

    expect(isUsableSelectionRect({
        left: 0,
        top: 0,
        right: 10,
        bottom: 10,
        width: 4.99,
        height: 5,
    }, 5)).toBe(false);
});

test("selection rectangle usability rejects zero, negative, and sub-minimum dimensions", () => {
    expect(isUsableSelectionRect({
        left: 0,
        top: 0,
        right: 0,
        bottom: 10,
        width: 0,
        height: 10,
    })).toBe(false);

    expect(isUsableSelectionRect({
        left: 10,
        top: 0,
        right: 0,
        bottom: 10,
    })).toBe(false);

    expect(isUsableSelectionRect({
        left: 0,
        top: 0,
        right: 10,
        bottom: 0.99,
    })).toBe(false);
});

test("intersection area measures the overlap between a selection rect and a page rect", () => {
    expect(rectIntersectionArea(
        { left: 10, top: 10, right: 30, bottom: 30 },
        { left: 20, top: 20, right: 40, bottom: 40 },
    )).toBe(100);

    expect(rectIntersectionArea(
        { left: 10, top: 10, right: 20, bottom: 20 },
        { left: 30, top: 30, right: 40, bottom: 40 },
    )).toBe(0);
});

test("intersection area is zero when rectangles only touch at an edge", () => {
    expect(rectIntersectionArea(
        { left: 10, top: 10, right: 20, bottom: 20 },
        { left: 20, top: 10, right: 30, bottom: 20 },
    )).toBe(0);
});

test("intersection area handles full containment", () => {
    expect(rectIntersectionArea(
        { left: 10, top: 10, right: 50, bottom: 50 },
        { left: 20, top: 25, right: 30, bottom: 35 },
    )).toBe(100);
});

test("best page hit uses the largest intersection and ignores invalid page numbers", () => {
    const hit = findBestPageForRect(
        { left: 90, top: 90, right: 160, bottom: 140 },
        [
            {
                pageNumber: Number.NaN,
                rect: { left: 0, top: 0, right: 200, bottom: 200 },
                label: "invalid",
            },
            {
                pageNumber: 1,
                rect: { left: 0, top: 0, right: 120, bottom: 200 },
                label: "page-1",
            },
            {
                pageNumber: 2,
                rect: { left: 120, top: 0, right: 240, bottom: 200 },
                label: "page-2",
            },
        ],
    );

    expect(hit?.pageNumber).toBe(2);
    expect(hit?.label).toBe("page-2");
});

test("best page hit is undefined when every intersection is zero", () => {
    expect(findBestPageForRect(
        { left: 10, top: 10, right: 20, bottom: 20 },
        [
            {
                pageNumber: 1,
                rect: { left: 20, top: 10, right: 40, bottom: 40 },
            },
            {
                pageNumber: 2,
                rect: { left: 100, top: 100, right: 200, bottom: 200 },
            },
        ],
    )).toBeUndefined();
});

test("best page hit keeps the first page when intersections are tied", () => {
    const hit = findBestPageForRect(
        { left: 10, top: 10, right: 30, bottom: 30 },
        [
            {
                pageNumber: 1,
                rect: { left: 0, top: 0, right: 20, bottom: 40 },
                label: "first",
            },
            {
                pageNumber: 2,
                rect: { left: 20, top: 0, right: 40, bottom: 40 },
                label: "second",
            },
        ],
    );

    expect(hit?.label).toBe("first");
});

test("clamp returns the value when it is inside bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
});

test("clamp returns the lower bound when the value is below bounds", () => {
    expect(clamp(-2, 0, 10)).toBe(0);
});

test("clamp returns the upper bound when the value is above bounds", () => {
    expect(clamp(12, 0, 10)).toBe(10);
});

test("client rects are converted to page-local viewport rects with border removal and clamping", () => {
    expect(clientRectToPageViewportRect(
        { left: 95, top: 45, right: 760, bottom: 910 },
        { left: 100, top: 50, right: 700, bottom: 850 },
        { left: 10, top: 5 },
        { width: 600, height: 800 },
    )).toEqual({
        left: 0,
        right: 600,
        top: 0,
        bottom: 800,
    });
});

test("client rects outside the page are rejected after clamping", () => {
    expect(clientRectToPageViewportRect(
        { left: 710, top: 100, right: 720, bottom: 120 },
        { left: 100, top: 50, right: 700, bottom: 850 },
        { left: 0, top: 0 },
        { width: 600, height: 800 },
    )).toBeUndefined();
});

test("client rect conversion preserves valid fractional page-local coordinates", () => {
    expect(clientRectToPageViewportRect(
        { left: 120.25, top: 75.5, right: 180.75, bottom: 92.25 },
        { left: 100, top: 50, right: 700, bottom: 850 },
        { left: 10, top: 5 },
        { width: 600, height: 800 },
    )).toEqual({
        left: 10.25,
        right: 70.75,
        top: 20.5,
        bottom: 37.25,
    });
});

test("client rect conversion rejects rectangles narrower than one viewport pixel after clamping", () => {
    expect(clientRectToPageViewportRect(
        { left: 699.4, top: 100, right: 701, bottom: 120 },
        { left: 100, top: 50, right: 700, bottom: 850 },
        { left: 0, top: 0 },
        { width: 600, height: 800 },
    )).toBeUndefined();
});

test("client rect conversion rejects rectangles shorter than one viewport pixel after clamping", () => {
    expect(clientRectToPageViewportRect(
        { left: 120, top: 849.4, right: 140, bottom: 851 },
        { left: 100, top: 50, right: 700, bottom: 850 },
        { left: 0, top: 0 },
        { width: 600, height: 800 },
    )).toBeUndefined();
});

test("PDF rectangles are normalized after viewport conversion", () => {
    expect(normalizePdfRect(100, 50, 40, 90)).toEqual({
        x1: 40,
        y1: 50,
        x2: 100,
        y2: 90,
    });
});

test("PDF rectangle normalization preserves already ordered coordinates", () => {
    expect(normalizePdfRect(10, 20, 30, 40)).toEqual({
        x1: 10,
        y1: 20,
        x2: 30,
        y2: 40,
    });
});

test("page viewport rectangles can be converted to PDF rectangles with a fake viewport", () => {
    const viewport = {
        width: 600,
        height: 800,
        convertToPdfPoint: (x: number, y: number) => [x / 2, (800 - y) / 2],
    };

    expect(pageViewportRectToPdfRect({
        left: 40,
        right: 140,
        top: 45,
        bottom: 65,
    }, viewport)).toEqual({
        x1: 20,
        y1: 367.5,
        x2: 70,
        y2: 377.5,
    });
});

test("page viewport rectangles are normalized for fake rotated viewport output", () => {
    const viewport = {
        width: 600,
        height: 800,
        convertToPdfPoint: (x: number, y: number) => [600 - x, y],
    };

    expect(pageViewportRectToPdfRect({
        left: 40,
        right: 140,
        top: 45,
        bottom: 65,
    }, viewport)).toEqual({
        x1: 460,
        y1: 45,
        x2: 560,
        y2: 65,
    });
});

test("client rect to PDF rect can be tested without PDF.js by injecting a fake viewport", () => {
    const viewport = {
        width: 600,
        height: 800,
        convertToPdfPoint: (x: number, y: number) => [x / 2, (800 - y) / 2],
    };

    expect(clientRectToPdfRect(
        { left: 150, top: 100, right: 250, bottom: 120 },
        { left: 100, top: 50, right: 700, bottom: 850 },
        { left: 10, top: 5 },
        viewport,
    )).toEqual({
        x1: 20,
        y1: 367.5,
        x2: 70,
        y2: 377.5,
    });
});

test("client rect to PDF rect returns undefined when page-local conversion rejects the rect", () => {
    const viewport = {
        width: 600,
        height: 800,
        convertToPdfPoint: (x: number, y: number) => [x, y],
    };

    expect(clientRectToPdfRect(
        { left: 710, top: 100, right: 720, bottom: 120 },
        { left: 100, top: 50, right: 700, bottom: 850 },
        { left: 0, top: 0 },
        viewport,
    )).toBeUndefined();
});
