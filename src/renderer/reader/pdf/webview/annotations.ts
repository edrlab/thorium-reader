// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    IEventBusPdfPlayer,
    TPdfAnnotationDraftTransport,
    TPdfAnnotationRectTransport,
    TPdfAnnotationTransport,
} from "../common/pdfReader.type";

import type { PDFViewer } from "pdf.js/build/types/web/pdf_viewer";

const ANNOTATION_LAYER_CLASS = "thorium-pdf-annotation-layer";
const ANNOTATION_HIGHLIGHT_CLASS = "thorium-pdf-annotation-highlight";
const HIGHLIGHT_COLOR = "#FEF3BD";
const HIGHLIGHT_OPACITY = "0.35";
const DEBUG_PREFIX = "[Thorium PDF annotations]";

function debugLog(message: string, data?: unknown) {
    if (typeof data === "undefined") {
        console.log(DEBUG_PREFIX, message);
        return;
    }

    console.log(DEBUG_PREFIX, message, data);
}

function debugWarn(message: string, data?: unknown) {
    if (typeof data === "undefined") {
        console.warn(DEBUG_PREFIX, message);
        return;
    }

    console.warn(DEBUG_PREFIX, message, data);
}

type TPdfJsEventBus = {
    on?: (key: string, fn: (payload?: any) => void) => void;
    off?: (key: string, fn: (payload?: any) => void) => void;
    _on?: (key: string, fn: (payload?: any) => void) => void;
    _off?: (key: string, fn: (payload?: any) => void) => void;
};

// https://github.com/edrlab/pdf.js/blob/13263bb9deeb52e424b60d8f2a9f223c3599943f/web/app.js#L150
interface IPdfViewerApplication {
    eventBus?: TPdfJsEventBus;
    pdfDocument?: any;
    pdfViewer?: PDFViewer;
}

interface IPageHit {
    pageElement: HTMLElement;
    pageNumber: number;
}

export class PdfAnnotationController {

    private readonly annotations = new Map<string, TPdfAnnotationTransport>();
    private readonly pdfJsListeners: Array<{
        key: string;
        fn: (payload?: any) => void;
    }> = [];

    private initialized = false;
    private readySent = false;
    private renderAnimationFrame: number | undefined;

    public constructor(
        private readonly bus: IEventBusPdfPlayer,
        private readonly getPdfViewerApplication: () => IPdfViewerApplication | undefined,
    ) {
    }

    public init() {
        if (this.initialized) {
            debugLog("init skipped: controller already initialized");
            return;
        }
        this.initialized = true;
        debugLog("init");

        this.bus.subscribe("annotations:sync", this.onAnnotationsSync);
        this.bus.subscribe("highlight:create-from-selection", this.onCreateFromSelection);
        debugLog("subscribed to Thorium PDF annotation bus events");

        this.addPdfJsListener("pagesinit", this.onPdfReady);
        this.addPdfJsListener("documentloaded", this.onPdfReady);
        this.addPdfJsListener("pagerendered", this.onPageRendered);
        this.addPdfJsListener("scalechanging", this.onGeometryChanging);
        this.addPdfJsListener("rotationchanging", this.onGeometryChanging);

        const pdfViewerApplication = this.getPdfViewerApplication();
        if (pdfViewerApplication?.pdfDocument && pdfViewerApplication.pdfViewer?.pagesCount) {
            debugLog("PDF document already available at init", {
                pagesCount: pdfViewerApplication.pdfViewer.pagesCount,
            });
            window.setTimeout(this.onPdfReady, 0);
        }
    }

    public destroy() {
        debugLog("destroy");
        this.bus.remove(this.onAnnotationsSync, "annotations:sync");
        this.bus.remove(this.onCreateFromSelection, "highlight:create-from-selection");
        this.pdfJsListeners.forEach(({ key, fn }) => this.removePdfJsListener(key, fn));
        this.pdfJsListeners.length = 0;

        if (typeof this.renderAnimationFrame === "number") {
            window.cancelAnimationFrame(this.renderAnimationFrame);
            this.renderAnimationFrame = undefined;
        }

        this.removeAllOverlayLayers();
        this.annotations.clear();
        this.initialized = false;
        this.readySent = false;
    }

    private readonly onAnnotationsSync = (payload: {
        annotations: TPdfAnnotationTransport[];
    }) => {
        debugLog("annotations:sync received", {
            count: payload?.annotations?.length,
        });

        this.annotations.clear();
        for (const annotation of payload.annotations) {
            if (annotation?.id) {
                this.annotations.set(annotation.id, annotation);
            } else {
                debugWarn("annotations:sync ignored annotation without id", annotation);
            }
        }

        this.renderAll();
    };

    private readonly onCreateFromSelection = () => {
        debugLog("highlight:create-from-selection received");
        const draft = this.selectionToDraft();
        if (!draft) {
            debugLog("selection did not produce a PDF annotation draft");
            return;
        }

        debugLog("dispatching annotation:create-requested", {
            page: draft.page,
            rectCount: draft.rects.length,
            quoteLength: draft.quote?.length || 0,
        });
        this.bus.dispatch("annotation:create-requested", {
            draft,
        });
    };

    private readonly onPdfReady = () => {
        debugLog("PDF annotations controller ready signal candidate");
        this.renderAll();
        if (this.readySent) {
            debugLog("annotations:ready skipped: already sent");
            return;
        }

        this.readySent = true;
        debugLog("dispatching annotations:ready");
        this.bus.dispatch("annotations:ready");
    };

    private readonly onPageRendered = (payload?: {
        pageNumber?: number;
    }) => {
        const pageNumber = payload?.pageNumber;
        if (typeof pageNumber !== "number") {
            debugLog("pagerendered without pageNumber: rendering all pages", payload);
            this.renderAll();
            return;
        }

        debugLog("pagerendered: rendering page", { pageNumber });
        this.renderPage(pageNumber);
    };

    private readonly onGeometryChanging = () => {
        debugLog("PDF geometry changing: clearing overlays and scheduling render");
        this.removeAllOverlayLayers();
        this.scheduleRenderAll();
    };

    private selectionToDraft(): TPdfAnnotationDraftTransport | undefined {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
            debugLog("selection rejected: empty selection", {
                hasSelection: !!selection,
                rangeCount: selection?.rangeCount || 0,
            });
            return undefined;
        }

        const clientRects = this.getSelectionClientRects(selection);
        if (!clientRects.length) {
            debugLog("selection rejected: no usable client rects", {
                quoteLength: selection.toString().length,
            });
            return undefined;
        }
        debugLog("selection client rects collected", {
            rectCount: clientRects.length,
            quoteLength: selection.toString().length,
        });

        const pageNumbers = new Set<number>();
        for (const rect of clientRects) {
            const pageHit = this.findPageForClientRect(rect);
            if (!pageHit) {
                debugLog("selection rejected: rect does not intersect a PDF page", {
                    rect: this.describeRect(rect),
                });
                return undefined;
            }
            pageNumbers.add(pageHit.pageNumber);
            if (pageNumbers.size > 1) {
                debugLog("selection rejected: selection spans multiple pages", {
                    pages: Array.from(pageNumbers),
                });
                return undefined;
            }
        }

        const page = Array.from(pageNumbers)[0];
        const pageElement = this.getPageElement(page);
        const pageView = this.getPageView(page);
        if (!pageElement || !pageView?.viewport) {
            debugLog("selection rejected: missing page element or page viewport", {
                page,
                hasPageElement: !!pageElement,
                hasViewport: !!pageView?.viewport,
            });
            return undefined;
        }

        const rects = clientRects
            .map((rect) => this.clientRectToPdfRect(rect, pageElement, pageView))
            .filter((rect): rect is TPdfAnnotationRectTransport => !!rect);

        if (!rects.length) {
            debugLog("selection rejected: no valid PDF rects after conversion", {
                page,
                clientRectCount: clientRects.length,
            });
            return undefined;
        }

        debugLog("selection converted to PDF annotation draft", {
            page,
            rectCount: rects.length,
        });
        return {
            type: "pdf-text-highlight",
            page,
            rects,
            quote: selection.toString(),
        };
    }

    private getSelectionClientRects(selection: Selection) {
        const rects: DOMRect[] = [];
        for (let rangeIndex = 0; rangeIndex < selection.rangeCount; rangeIndex++) {
            const range = selection.getRangeAt(rangeIndex);
            const rangeRects = range.getClientRects();
            for (let rectIndex = 0; rectIndex < rangeRects.length; rectIndex++) {
                const rect = rangeRects.item(rectIndex);
                if (rect && rect.width >= 1 && rect.height >= 1) {
                    rects.push(rect);
                } else if (rect) {
                    debugLog("selection rect ignored: too small", {
                        rect: this.describeRect(rect),
                    });
                }
            }
        }

        return rects;
    }

    private findPageForClientRect(rect: DOMRect): IPageHit | undefined {
        const pageElements = Array.from(document.querySelectorAll<HTMLElement>(".page[data-page-number]"));
        let bestHit: IPageHit | undefined;
        let bestArea = 0;

        for (const pageElement of pageElements) {
            const pageRect = pageElement.getBoundingClientRect();
            const intersectionWidth = Math.max(0, Math.min(rect.right, pageRect.right) - Math.max(rect.left, pageRect.left));
            const intersectionHeight = Math.max(0, Math.min(rect.bottom, pageRect.bottom) - Math.max(rect.top, pageRect.top));
            const area = intersectionWidth * intersectionHeight;

            if (area > bestArea) {
                const pageNumber = Number(pageElement.dataset.pageNumber);
                if (Number.isFinite(pageNumber)) {
                    bestArea = area;
                    bestHit = {
                        pageElement,
                        pageNumber,
                    };
                }
            }
        }

        return bestArea > 0 ? bestHit : undefined;
    }

    private clientRectToPdfRect(rect: DOMRect, pageElement: HTMLElement, pageView: any): TPdfAnnotationRectTransport | undefined {
        const viewport = pageView.viewport;
        const pageRect = pageElement.getBoundingClientRect();
        const border = this.getPageBorderWidths(pageElement);
        const viewportWidth = Number(viewport.width) || pageElement.clientWidth;
        const viewportHeight = Number(viewport.height) || pageElement.clientHeight;

        const left = this.clamp(rect.left - pageRect.left - border.left, 0, viewportWidth);
        const right = this.clamp(rect.right - pageRect.left - border.left, 0, viewportWidth);
        const top = this.clamp(rect.top - pageRect.top - border.top, 0, viewportHeight);
        const bottom = this.clamp(rect.bottom - pageRect.top - border.top, 0, viewportHeight);

        if (right - left < 1 || bottom - top < 1) {
            debugLog("client rect ignored after page-local clamping", {
                rect: this.describeRect(rect),
                pageLocalRect: { left, right, top, bottom },
            });
            return undefined;
        }

        const [pdfX1, pdfY1] = viewport.convertToPdfPoint(left, top);
        const [pdfX2, pdfY2] = viewport.convertToPdfPoint(right, bottom);

        return {
            x1: Math.min(pdfX1, pdfX2),
            y1: Math.min(pdfY1, pdfY2),
            x2: Math.max(pdfX1, pdfX2),
            y2: Math.max(pdfY1, pdfY2),
        };
    }

    private renderAll() {
        this.removeAllOverlayLayers();
        if (!this.annotations.size) {
            debugLog("renderAll skipped: no annotations");
            return;
        }

        const pageElements = Array.from(document.querySelectorAll<HTMLElement>(".page[data-page-number]"));
        debugLog("renderAll", {
            annotationCount: this.annotations.size,
            pageElementCount: pageElements.length,
        });
        for (const pageElement of pageElements) {
            const pageNumber = Number(pageElement.dataset.pageNumber);
            if (Number.isFinite(pageNumber)) {
                this.renderPage(pageNumber);
            }
        }
    }

    private renderPage(pageNumber: number) {
        const pageElement = this.getPageElement(pageNumber);
        const pageView = this.getPageView(pageNumber);
        if (!pageElement || !pageView?.viewport) {
            debugLog("renderPage skipped: missing page element or viewport", {
                pageNumber,
                hasPageElement: !!pageElement,
                hasViewport: !!pageView?.viewport,
            });
            return;
        }

        this.removeOverlayLayer(pageElement);

        const annotations = Array.from(this.annotations.values())
            .filter((annotation) => annotation.page === pageNumber);
        if (!annotations.length) {
            // debugLog("renderPage skipped: no annotations for page", { pageNumber });
            return;
        }

        const layer = this.createOverlayLayer();
        pageElement.append(layer);
        debugLog("renderPage", {
            pageNumber,
            annotationCount: annotations.length,
            rectCount: annotations.reduce((count, annotation) => count + annotation.rects.length, 0),
        });

        for (const annotation of annotations) {
            for (const rect of annotation.rects) {
                const highlight = this.createHighlightElement(annotation, rect, pageView);
                if (highlight) {
                    layer.append(highlight);
                }
            }
        }
    }

    private createOverlayLayer() {
        const layer = document.createElement("div");
        layer.className = ANNOTATION_LAYER_CLASS;
        layer.setAttribute("aria-hidden", "true");
        layer.style.position = "absolute";
        layer.style.inset = "0";
        layer.style.pointerEvents = "none";
        layer.style.zIndex = "2";

        return layer;
    }

    private createHighlightElement(
        annotation: TPdfAnnotationTransport,
        rect: TPdfAnnotationRectTransport,
        pageView: any,
    ) {
        const viewportRect = pageView.viewport.convertToViewportRectangle([
            rect.x1,
            rect.y1,
            rect.x2,
            rect.y2,
        ]);
        const left = Math.min(viewportRect[0], viewportRect[2]);
        const top = Math.min(viewportRect[1], viewportRect[3]);
        const width = Math.abs(viewportRect[0] - viewportRect[2]);
        const height = Math.abs(viewportRect[1] - viewportRect[3]);

        if (width < 0.5 || height < 0.5) {
            debugLog("highlight skipped: viewport rectangle too small", {
                annotationId: annotation.id,
                rect,
                viewportRect,
            });
            return undefined;
        }

        const highlight = document.createElement("div");
        highlight.className = ANNOTATION_HIGHLIGHT_CLASS;
        highlight.dataset.annotationId = annotation.id;
        highlight.style.position = "absolute";
        highlight.style.left = `${left}px`;
        highlight.style.top = `${top}px`;
        highlight.style.width = `${width}px`;
        highlight.style.height = `${height}px`;
        highlight.style.backgroundColor = HIGHLIGHT_COLOR;
        highlight.style.opacity = HIGHLIGHT_OPACITY;
        highlight.style.pointerEvents = "none";
        highlight.style.mixBlendMode = "multiply";

        return highlight;
    }

    private scheduleRenderAll() {
        if (typeof this.renderAnimationFrame === "number") {
            window.cancelAnimationFrame(this.renderAnimationFrame);
            debugLog("cancelled pending scheduled render");
        }

        debugLog("scheduled renderAll after geometry change");
        this.renderAnimationFrame = window.requestAnimationFrame(() => {
            this.renderAnimationFrame = window.requestAnimationFrame(() => {
                this.renderAnimationFrame = undefined;
                this.renderAll();
            });
        });
    }

    private getPageView(pageNumber: number) {
        const pdfViewer = this.getPdfViewerApplication()?.pdfViewer;
        if (!pdfViewer) {
            debugLog("getPageView failed: missing PDF viewer", { pageNumber });
            return undefined;
        }

        if (typeof pdfViewer.getPageView === "function") {
            return pdfViewer.getPageView(pageNumber - 1);
        }

        return pdfViewer._pages?.[pageNumber - 1];
    }

    private getPageElement(pageNumber: number) {
        return document.querySelector<HTMLElement>(`.page[data-page-number="${pageNumber}"]`);
    }

    private getPageBorderWidths(pageElement: HTMLElement) {
        const style = window.getComputedStyle(pageElement);

        return {
            left: parseFloat(style.borderLeftWidth) || 0,
            top: parseFloat(style.borderTopWidth) || 0,
        };
    }

    private removeAllOverlayLayers() {
        document.querySelectorAll<HTMLElement>(`.${ANNOTATION_LAYER_CLASS}`).forEach((layer) => layer.remove());
    }

    private removeOverlayLayer(pageElement: HTMLElement) {
        Array.from(pageElement.children)
            .filter((child) => child.classList.contains(ANNOTATION_LAYER_CLASS))
            .forEach((child) => child.remove());
    }

    private addPdfJsListener(key: string, fn: (payload?: any) => void) {
        const eventBus = this.getPdfViewerApplication()?.eventBus;
        if (!eventBus) {
            debugWarn("PDF.js listener not registered: missing event bus", { key });
            return;
        }

        if (typeof eventBus.on === "function") {
            eventBus.on(key, fn);
        } else if (typeof eventBus._on === "function") {
            eventBus._on(key, fn);
        } else {
            debugWarn("PDF.js listener not registered: no compatible on method", { key });
            return;
        }

        debugLog("PDF.js listener registered", { key });
        this.pdfJsListeners.push({ key, fn });
    }

    private removePdfJsListener(key: string, fn: (payload?: any) => void) {
        const eventBus = this.getPdfViewerApplication()?.eventBus;
        if (!eventBus) {
            debugWarn("PDF.js listener not removed: missing event bus", { key });
            return;
        }

        if (typeof eventBus.off === "function") {
            eventBus.off(key, fn);
        } else if (typeof eventBus._off === "function") {
            eventBus._off(key, fn);
        } else {
            debugWarn("PDF.js listener not removed: no compatible off method", { key });
        }
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
    }

    private describeRect(rect: DOMRect) {
        return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
        };
    }
}

export function createPdfAnnotationController(
    bus: IEventBusPdfPlayer,
    getPdfViewerApplication: () => IPdfViewerApplication | undefined,
) {
    return new PdfAnnotationController(bus, getPdfViewerApplication);
}
