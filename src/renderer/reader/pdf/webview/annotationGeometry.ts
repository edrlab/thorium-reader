// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IRectLike {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width?: number;
    height?: number;
}

export interface IPageRectLike {
    pageNumber: number;
    rect: IRectLike;
}

export interface IPageBorderWidths {
    left: number;
    top: number;
}

export interface IViewportSize {
    width: number;
    height: number;
}

export interface IViewportPdfConverter extends IViewportSize {
    convertToPdfPoint: (x: number, y: number) => number[];
}

export interface IPageViewportRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface IPdfRectLike {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export function rectWidth(rect: IRectLike) {
    return typeof rect.width === "number" ? rect.width : rect.right - rect.left;
}

export function rectHeight(rect: IRectLike) {
    return typeof rect.height === "number" ? rect.height : rect.bottom - rect.top;
}

export function isUsableSelectionRect(rect: IRectLike, minimumSize = 1) {
    return rectWidth(rect) >= minimumSize && rectHeight(rect) >= minimumSize;
}

export function rectIntersectionArea(a: IRectLike, b: IRectLike) {
    const intersectionWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const intersectionHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

    return intersectionWidth * intersectionHeight;
}

export function findBestPageForRect<TPage extends IPageRectLike>(
    rect: IRectLike,
    pages: TPage[],
) {
    let bestPage: TPage | undefined;
    let bestArea = 0;

    for (const page of pages) {
        const area = rectIntersectionArea(rect, page.rect);
        if (area > bestArea && Number.isFinite(page.pageNumber)) {
            bestArea = area;
            bestPage = page;
        }
    }

    return bestArea > 0 ? bestPage : undefined;
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function clientRectToPageViewportRect(
    rect: IRectLike,
    pageRect: IRectLike,
    border: IPageBorderWidths,
    viewport: IViewportSize,
): IPageViewportRect | undefined {
    const left = clamp(rect.left - pageRect.left - border.left, 0, viewport.width);
    const right = clamp(rect.right - pageRect.left - border.left, 0, viewport.width);
    const top = clamp(rect.top - pageRect.top - border.top, 0, viewport.height);
    const bottom = clamp(rect.bottom - pageRect.top - border.top, 0, viewport.height);

    if (right - left < 1 || bottom - top < 1) {
        return undefined;
    }

    return {
        left,
        right,
        top,
        bottom,
    };
}

export function normalizePdfRect(
    pdfX1: number,
    pdfY1: number,
    pdfX2: number,
    pdfY2: number,
): IPdfRectLike {
    return {
        x1: Math.min(pdfX1, pdfX2),
        y1: Math.min(pdfY1, pdfY2),
        x2: Math.max(pdfX1, pdfX2),
        y2: Math.max(pdfY1, pdfY2),
    };
}

export function pageViewportRectToPdfRect(
    rect: IPageViewportRect,
    viewport: IViewportPdfConverter,
) {
    const [pdfX1, pdfY1] = viewport.convertToPdfPoint(rect.left, rect.top);
    const [pdfX2, pdfY2] = viewport.convertToPdfPoint(rect.right, rect.bottom);

    return normalizePdfRect(pdfX1, pdfY1, pdfX2, pdfY2);
}

export function clientRectToPdfRect(
    rect: IRectLike,
    pageRect: IRectLike,
    border: IPageBorderWidths,
    viewport: IViewportPdfConverter,
) {
    const pageViewportRect = clientRectToPageViewportRect(rect, pageRect, border, viewport);

    return pageViewportRect ? pageViewportRectToPdfRect(pageViewportRect, viewport) : undefined;
}
