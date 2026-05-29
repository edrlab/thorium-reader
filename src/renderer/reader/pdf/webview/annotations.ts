// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IEventBusPdfPlayer } from "../common/pdfReader.type";
import type {
    IColor,
    TPdfAnnotationDrawType,
    TPdfAnnotationDraftTransport,
    TPdfAnnotationNavigationTarget,
    TPdfAnnotationRectTransport,
    TPdfAnnotationSelectionErrorReason,
    TPdfAnnotationSelectionTarget,
    TPdfAnnotationTransport,
} from "../common/pdfAnnotation.type";
import {
    clientRectToPageViewportRect,
    findBestPageForRect,
    isUsableSelectionRect,
    pageViewportRectToPdfRect,
} from "./annotationGeometry";
import { isValidPdfAnnotationRect } from "../common/pdfAnnotationValidation";

const ANNOTATION_LAYER_CLASS = "thorium-pdf-annotation-layer";
const ANNOTATION_HIGHLIGHT_CLASS = "thorium-pdf-annotation-highlight";
const ANNOTATION_CLICKABLE_CURSOR_CLASS = "thorium-pdf-annotation-clickable-cursor";
const ANNOTATION_CLICKABLE_CURSOR_STYLE_ID = "thorium-pdf-annotation-clickable-cursor-style";
const DEFAULT_HIGHLIGHT_COLOR: IColor = {
    red: 254,
    green: 243,
    blue: 189,
};
const HIGHLIGHT_OPACITY = "0.35";
const DEBUG_PREFIX = "[Thorium PDF annotations]";
const DEBUG_FLAG = "__THORIUM_PDF_ANNOTATIONS_DEBUG";
const INSTANT_ANNOTATION_SELECTION_DELAY_MS = 250;

function isDebugLoggingEnabled() {
    return typeof window !== "undefined" && !!(window as any)[DEBUG_FLAG];
}

function debugLog(message: string, data?: unknown) {
    if (!isDebugLoggingEnabled()) {
        return;
    }

    if (typeof data === "undefined") {
        console.log(DEBUG_PREFIX, message);
        return;
    }

    console.log(DEBUG_PREFIX, message, data);
}

function normalizeRgbChannel(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.max(0, Math.min(255, Math.round(value)))
        : fallback;
}

function colorToCss(color?: Partial<IColor>) {
    const red = normalizeRgbChannel(color?.red, DEFAULT_HIGHLIGHT_COLOR.red);
    const green = normalizeRgbChannel(color?.green, DEFAULT_HIGHLIGHT_COLOR.green);
    const blue = normalizeRgbChannel(color?.blue, DEFAULT_HIGHLIGHT_COLOR.blue);

    return `rgb(${red}, ${green}, ${blue})`;
}

function normalizePdfAnnotationDrawType(drawType?: string): TPdfAnnotationDrawType {
    if (
        drawType === "solid_background" ||
        drawType === "underline" ||
        drawType === "strikethrough" ||
        drawType === "outline"
    ) {
        return drawType;
    }

    return "solid_background";
}

/**
 * PDF.js EventBus has changed shape across versions and builds. The controller
 * accepts both public and underscored methods so this first slice can integrate
 * with the currently embedded PDF.js without forcing an upstream PDF.js upgrade.
 */
type TPdfJsEventBus = {
    on?: (key: string, fn: (payload?: any) => void) => void;
    off?: (key: string, fn: (payload?: any) => void) => void;
    _on?: (key: string, fn: (payload?: any) => void) => void;
    _off?: (key: string, fn: (payload?: any) => void) => void;
};

// https://github.com/edrlab/pdf.js/blob/13263bb9deeb52e424b60d8f2a9f223c3599943f/web/app.js#L150
/**
 * Minimal shape of the PDF.js application object used by this controller. This
 * is intentionally narrower than the full PDF.js app so the integration surface
 * remains explicit and easier to replace during future PDF.js upgrades.
 */
interface IPdfViewerApplication {
    eventBus?: TPdfJsEventBus;
    pdfDocument?: any;
    pdfViewer?: any;
}

/**
 * Page hit-testing result used while converting browser selection rectangles.
 * The page number stays 1-based because both PDF.js DOM attributes and Thorium
 * annotation transport use 1-based pages.
 */
interface IPageHit {
    pageElement: HTMLElement;
    pageNumber: number;
}

interface IAnnotationPointerDown {
    button: number;
    x: number;
    y: number;
}

interface IAnnotationClickCandidate {
    annotation: TPdfAnnotationTransport;
    area: number;
    distanceFromCenter: number;
    order: number;
    rect: TPdfAnnotationRectTransport;
    rectIndex: number;
}

interface ISelectionToDraftSuccess {
    draft: TPdfAnnotationDraftTransport;
}

interface ISelectionToDraftFailure {
    reason: TPdfAnnotationSelectionErrorReason;
}

type TSelectionToDraftResult = ISelectionToDraftSuccess | ISelectionToDraftFailure;

export class PdfAnnotationController {

    /**
     * Render state is intentionally a Map keyed by the canonical annotation id
     * assigned by the host. The webview treats "annotations:sync" as a snapshot,
     * so there is no local diffing, conflict resolution, or persistence policy
     * hidden in this controller.
     */
    private readonly annotations = new Map<string, TPdfAnnotationTransport>();

    /**
     * PDF.js exposes both public and underscored EventBus methods depending on
     * the embedded version. Keeping registered listeners here lets destroy()
     * remove exactly what init() added, which is important when the webview is
     * recreated or navigated inside the reader.
     */
    private readonly pdfJsListeners: Array<{
        key: string;
        fn: (payload?: any) => void;
    }> = [];

    private initialized = false;
    private readySent = false;
    private renderAnimationFrame: number | undefined;
    private annotationPointerDown: IAnnotationPointerDown | undefined;
    private instantAnnotationModeEnabled = false;
    private instantAnnotationTimer: number | undefined;
    private lastInstantAnnotationDraftSignature = "";
    private annotationsVisible = true;

    public constructor(
        private readonly bus: IEventBusPdfPlayer,
        private readonly getPdfViewerApplication: () => IPdfViewerApplication | undefined,
    ) {
    }

    /**
     * Initializes the controller once per PDF webview lifetime.
     *
     * Architecture choice: listen to Thorium bus events for cross-frame commands
     * and PDF.js EventBus events for geometry lifecycle. This keeps PDF.js DOM
     * details isolated in this file while the parent reader owns application
     * state and note creation.
     */
    public init() {
        if (this.initialized) {
            debugLog("init skipped: controller already initialized");
            return;
        }
        this.initialized = true;
        debugLog("init");

        this.bus.subscribe("annotations:sync", this.onAnnotationsSync);
        this.bus.subscribe("annotations:set-instant-mode", this.onSetInstantMode);
        this.bus.subscribe("annotations:set-visibility", this.onSetVisibility);
        this.bus.subscribe("highlight:create-from-selection", this.onCreateFromSelection);
        this.bus.subscribe("viewer:go-to-annotation", this.onGoToAnnotation);
        debugLog("subscribed to Thorium PDF annotation bus events");

        this.ensureClickableCursorStyle();
        document.addEventListener("selectionchange", this.onSelectionChange, true);
        document.addEventListener("pointerdown", this.onAnnotationPointerDown, true);
        document.addEventListener("pointermove", this.onAnnotationPointerMove, true);
        document.addEventListener("pointerleave", this.onAnnotationPointerLeave, true);
        document.addEventListener("click", this.onAnnotationClick, true);

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

    /**
     * Tears down all local effects created by init(): bus subscriptions, PDF.js
     * listeners, pending renders, overlay DOM, and in-memory annotation state.
     * This prevents duplicate overlays or duplicate create requests after a PDF
     * document reloads inside the same webview.
     */
    public destroy() {
        debugLog("destroy");
        this.bus.remove(this.onAnnotationsSync, "annotations:sync");
        this.bus.remove(this.onSetInstantMode, "annotations:set-instant-mode");
        this.bus.remove(this.onSetVisibility, "annotations:set-visibility");
        this.bus.remove(this.onCreateFromSelection, "highlight:create-from-selection");
        this.bus.remove(this.onGoToAnnotation, "viewer:go-to-annotation");
        document.removeEventListener("selectionchange", this.onSelectionChange, true);
        document.removeEventListener("pointerdown", this.onAnnotationPointerDown, true);
        document.removeEventListener("pointermove", this.onAnnotationPointerMove, true);
        document.removeEventListener("pointerleave", this.onAnnotationPointerLeave, true);
        document.removeEventListener("click", this.onAnnotationClick, true);
        this.pdfJsListeners.forEach(({ key, fn }) => this.removePdfJsListener(key, fn));
        this.pdfJsListeners.length = 0;

        if (typeof this.renderAnimationFrame === "number") {
            window.cancelAnimationFrame(this.renderAnimationFrame);
            this.renderAnimationFrame = undefined;
        }
        this.clearInstantAnnotationTimer();

        this.removeAllOverlayLayers();
        this.setAnnotationHoverCursor(false);
        this.removeClickableCursorStyle();
        this.annotations.clear();
        this.annotationPointerDown = undefined;
        this.instantAnnotationModeEnabled = false;
        this.lastInstantAnnotationDraftSignature = "";
        this.annotationsVisible = true;
        this.initialized = false;
        this.readySent = false;
    }

    /**
     * Applies the host snapshot as the only renderable truth.
     *
     * Spec choice: the payload replaces the whole local map. This is simpler
     * than patch events and fits the MVP, where annotation counts are expected
     * to be small and correctness is more important than avoiding a full redraw.
     */
    private readonly onAnnotationsSync = (payload?: {
        annotations?: TPdfAnnotationTransport[];
    }) => {
        const annotations = payload?.annotations;
        debugLog("annotations:sync received", {
            count: Array.isArray(annotations) ? annotations.length : undefined,
        });

        if (!Array.isArray(annotations)) {
            console.error(DEBUG_PREFIX, "annotations:sync ignored invalid payload", payload);
            return;
        }

        this.annotations.clear();
        for (const annotation of annotations) {
            if (annotation?.id) {
                this.annotations.set(annotation.id, annotation);
            } else {
                console.error(DEBUG_PREFIX, "annotations:sync ignored annotation without id", annotation);
            }
        }

        this.renderAll();
    };

    private readonly onSetInstantMode = (payload?: {
        enabled?: boolean;
    }) => {
        if (typeof payload?.enabled !== "boolean") {
            console.error(DEBUG_PREFIX, "annotations:set-instant-mode ignored invalid payload", payload);
            return;
        }

        this.instantAnnotationModeEnabled = payload.enabled;
        this.clearInstantAnnotationTimer();
        if (!payload.enabled) {
            this.lastInstantAnnotationDraftSignature = "";
        }

        debugLog("annotations:set-instant-mode", {
            enabled: payload.enabled,
        });
    };

    private readonly onSetVisibility = (payload?: {
        visible?: boolean;
    }) => {
        if (typeof payload?.visible !== "boolean") {
            console.error(DEBUG_PREFIX, "annotations:set-visibility ignored invalid payload", payload);
            return;
        }

        this.annotationsVisible = payload.visible;
        this.setAnnotationHoverCursor(false);

        if (payload.visible) {
            this.renderAll();
        } else {
            this.removeAllOverlayLayers();
        }

        debugLog("annotations:set-visibility", {
            visible: payload.visible,
        });
    };

    /**
     * Converts the current PDF text selection into a draft and delegates all
     * note creation decisions to the host. This method intentionally does not
     * render an optimistic highlight because the final id, color policy, and
     * persistence result belong to the parent reader.
     */
    private readonly onCreateFromSelection = () => {
        debugLog("highlight:create-from-selection received");
        const result = this.selectionToDraft();
        if ("reason" in result) {
            this.dispatchSelectionError(result.reason, "highlight:create-from-selection");
            return;
        }

        const { draft } = result;
        debugLog("dispatching annotation:create-requested", {
            page: draft.page,
            rectCount: draft.rects.length,
            quoteLength: draft.quote?.length || 0,
        });
        this.bus.dispatch("annotation:create-requested", {
            draft,
            source: "highlight:create-from-selection",
        });
    };

    private dispatchSelectionError(
        reason: TPdfAnnotationSelectionErrorReason,
        source: "highlight:create-from-selection" | "instant-selection",
    ) {
        debugLog("dispatching annotation:selection-error", { reason, source });
        this.bus.dispatch("annotation:selection-error", {
            source,
            reason,
        });
    }

    private readonly onSelectionChange = () => {
        if (!this.instantAnnotationModeEnabled) {
            return;
        }

        if (!window.getSelection?.()?.toString().trim()) {
            this.clearInstantAnnotationTimer();
            this.lastInstantAnnotationDraftSignature = "";
            return;
        }

        this.clearInstantAnnotationTimer();
        this.instantAnnotationTimer = window.setTimeout(
            this.createInstantAnnotationFromSelection,
            INSTANT_ANNOTATION_SELECTION_DELAY_MS,
        );
    };

    private readonly createInstantAnnotationFromSelection = () => {
        this.instantAnnotationTimer = undefined;

        if (!this.instantAnnotationModeEnabled) {
            return;
        }

        const result = this.selectionToDraft();
        if ("reason" in result) {
            if (result.reason !== "empty") {
                this.dispatchSelectionError(result.reason, "instant-selection");
            }
            return;
        }

        const signature = this.getDraftSignature(result.draft);
        if (signature === this.lastInstantAnnotationDraftSignature) {
            debugLog("instant annotation skipped: selection already dispatched");
            return;
        }

        this.lastInstantAnnotationDraftSignature = signature;
        debugLog("dispatching instant annotation:create-requested", {
            page: result.draft.page,
            rectCount: result.draft.rects.length,
            quoteLength: result.draft.quote?.length || 0,
        });
        this.bus.dispatch("annotation:create-requested", {
            draft: result.draft,
            source: "instant-selection",
        });
    };

    /**
     * Navigates from Thorium's annotation panel to a rendered PDF target.
     *
     * The id is preferred because it points at the canonical host annotation.
     * The page/rect fallback keeps navigation usable after a panel click even if
     * the webview snapshot has not caught up yet or the target id is unknown.
     */
    private readonly onGoToAnnotation = (payload?: TPdfAnnotationNavigationTarget) => {
        const target = this.resolveNavigationTarget(payload);
        if (!target) {
            console.error(DEBUG_PREFIX, "viewer:go-to-annotation ignored invalid payload", payload);
            return;
        }

        debugLog("viewer:go-to-annotation", {
            id: target.id,
            page: target.page,
        });
        this.scrollToAnnotationTarget(target);
    };

    private readonly onAnnotationPointerDown = (event: PointerEvent | MouseEvent) => {
        this.annotationPointerDown = {
            button: event.button,
            x: event.clientX,
            y: event.clientY,
        };
    };

    private readonly onAnnotationPointerMove = (event: PointerEvent | MouseEvent) => {
        this.setAnnotationHoverCursor(this.shouldShowClickableAnnotationCursor(event));
    };

    private readonly onAnnotationPointerLeave = () => {
        this.setAnnotationHoverCursor(false);
    };

    /**
     * Selects a rendered PDF annotation without making the overlay layer
     * pointer-interactive.
     *
     * Why this algorithm:
     * - PDF.js text selection lives below this controller's overlay. Changing
     *   highlight elements to `pointer-events: auto` would make the highlight a
     *   new hit target and can steal drag/selection behavior from the text
     *   layer.
     * - A document-level click listener can keep the overlay passive and still
     *   compare the click point against rendered highlight rectangles. The
     *   browser remains free to deliver the original event to PDF.js controls
     *   and text spans because this handler does not prevent default or stop
     *   propagation.
     * - The click still has to originate from a PDF page element. This prevents
     *   toolbar buttons, popovers, or test harness UI that visually overlap a
     *   highlight from selecting an annotation by geometry alone.
     *
     * Critique:
     * - This depends on visible DOM geometry, so unusual CSS transforms or
     *   stale overlay DOM could affect hit testing. It is still preferable for
     *   this slice because rendered geometry is exactly what the user sees.
     * - Overlapping highlights are resolved locally by picking the smallest
     *   matching rectangle, then the closest center, then the latest rendered
     *   element. If richer stacking rules are needed later, extract this into a
     *   dedicated policy helper and test those product rules directly.
     */
    private readonly onAnnotationClick = (event: MouseEvent) => {
        const target = this.selectionTargetFromClick(event);
        if (!target) {
            return;
        }

        debugLog("annotation:selected", {
            id: target.id,
            page: target.page,
            rectIndex: target.rectIndex,
        });
        this.bus.dispatch("annotation:selected", target);
    };

    /**
     * Announces that geometry is available for initial synchronization.
     *
     * "annotations:ready" is sent once because it is a capability signal, not a
     * page-render notification. Later page renders are handled by onPageRendered
     * and geometry changes schedule their own redraw.
     */
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

    /**
     * Renders only the affected page when PDF.js reports a page number. If the
     * payload is missing or version-specific, falling back to renderAll preserves
     * correctness while still keeping the normal path cheap.
     */
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

    /**
     * Scale and rotation invalidate every viewport-positioned overlay. We remove
     * old layers immediately to avoid stale highlights, then schedule a redraw
     * after PDF.js has had time to settle the new page geometry.
     */
    private readonly onGeometryChanging = () => {
        debugLog("PDF geometry changing: clearing overlays and scheduling render");
        this.removeAllOverlayLayers();
        this.setAnnotationHoverCursor(false);
        this.scheduleRenderAll();
    };

    private resolveNavigationTarget(payload?: TPdfAnnotationNavigationTarget): TPdfAnnotationNavigationTarget | undefined {
        if (!payload?.id || !Number.isInteger(payload.page) || payload.page < 1) {
            return undefined;
        }

        const annotation = this.annotations.get(payload.id);
        const page = annotation?.page ?? payload.page;
        if (!Number.isInteger(page) || page < 1) {
            return undefined;
        }

        const rect = this.normalizeNavigationRect(annotation?.rects[0] || payload.rect);
        if (!rect) {
            return undefined;
        }

        return {
            id: payload.id,
            page,
            rect,
        };
    }

    private normalizeNavigationRect(rect?: TPdfAnnotationRectTransport): TPdfAnnotationRectTransport | undefined {
        if (!rect) {
            return undefined;
        }

        const { x1, y1, x2, y2 } = rect;
        if (![x1, y1, x2, y2].every(Number.isFinite)) {
            return undefined;
        }

        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const top = Math.min(y1, y2);
        const bottom = Math.max(y1, y2);
        if (left === right || top === bottom) {
            return undefined;
        }

        return {
            x1: left,
            y1: top,
            x2: right,
            y2: bottom,
        };
    }

    private scrollToAnnotationTarget(target: TPdfAnnotationNavigationTarget) {
        const pdfViewer = this.getPdfViewerApplication()?.pdfViewer;
        if (typeof pdfViewer?.scrollPageIntoView === "function") {
            pdfViewer.scrollPageIntoView({ pageNumber: target.page });
        }

        const pageElement = this.getPageElement(target.page);
        if (!pageElement) {
            console.error(DEBUG_PREFIX, "viewer:go-to-annotation skipped: missing page element", {
                id: target.id,
                page: target.page,
            });
            return;
        }

        this.renderPage(target.page);

        const marker = this.createNavigationMarker(target, pageElement);
        if (marker) {
            pageElement.append(marker);
            this.scrollElementIntoView(marker);
            marker.remove();
        } else {
            this.scrollElementIntoView(pageElement);
        }

        this.flashAnnotationHighlights(target.id);
    }

    private createNavigationMarker(target: TPdfAnnotationNavigationTarget, pageElement: HTMLElement) {
        const pageView = this.getPageView(target.page);
        const viewportRect = pageView?.viewport?.convertToViewportRectangle?.([
            target.rect.x1,
            target.rect.y1,
            target.rect.x2,
            target.rect.y2,
        ]);
        if (!Array.isArray(viewportRect) || viewportRect.length < 4) {
            console.error(DEBUG_PREFIX, "viewer:go-to-annotation skipped rect alignment: missing viewport conversion", {
                id: target.id,
                page: target.page,
            });
            return undefined;
        }

        const left = Math.min(viewportRect[0], viewportRect[2]);
        const top = Math.min(viewportRect[1], viewportRect[3]);
        const width = Math.abs(viewportRect[0] - viewportRect[2]);
        const height = Math.abs(viewportRect[1] - viewportRect[3]);
        if (![left, top, width, height].every(Number.isFinite) || width < 0.5 || height < 0.5) {
            return undefined;
        }

        const marker = document.createElement("span");
        marker.style.position = "absolute";
        marker.style.pointerEvents = "none";
        marker.style.left = `${left}px`;
        marker.style.top = `${top}px`;
        marker.style.width = `${Math.max(width, 1)}px`;
        marker.style.height = `${Math.max(height, 1)}px`;

        if (window.getComputedStyle(pageElement).position === "static") {
            pageElement.style.position = "relative";
        }

        return marker;
    }

    private scrollElementIntoView(element: HTMLElement) {
        if (typeof element.scrollIntoView === "function") {
            element.scrollIntoView({
                block: "center",
                inline: "center",
            });
        }
    }

    private flashAnnotationHighlights(annotationId: string) {
        const highlights = Array.from(document.querySelectorAll<HTMLElement>(`.${ANNOTATION_HIGHLIGHT_CLASS}`))
            .filter((highlight) => highlight.dataset.annotationId === annotationId);
        if (!highlights.length) {
            return;
        }

        for (const highlight of highlights) {
            const previousOutline = highlight.style.outline;
            const previousOutlineOffset = highlight.style.outlineOffset;
            highlight.dataset.navigationFlash = "true";
            highlight.style.outline = "2px solid rgba(37, 99, 235, 0.95)";
            highlight.style.outlineOffset = "2px";
            window.setTimeout(() => {
                delete highlight.dataset.navigationFlash;
                highlight.style.outline = previousOutline;
                highlight.style.outlineOffset = previousOutlineOffset;
            }, 900);
        }
    }

    /**
     * Selection algorithm:
     * 1. Read the browser Selection from the PDF webview DOM.
     * 2. Collect visible client rects produced by each range.
     * 3. Resolve every rect to the PDF page it intersects.
     * 4. Reject multi-page selections.
     * 5. Convert page-local viewport pixels to PDF-space rectangles.
     *
     * Design rationale:
     * - Browser Selection / Range APIs are the source of truth for what the user
     *   selected visually. Range.getClientRects() gives viewport-relative DOMRect
     *   fragments for each selected line/glyph run.
     * - PDF.js is the source of truth for PDF geometry. PageViewport converts
     *   between rendered viewport coordinates and persisted PDF coordinates.
     * - Thorium's first persisted target stores one page number, so accepting a
     *   cross-page selection here would create ambiguous data. Later multi-page
     *   support must introduce an explicit multi-target shape before this
     *   rejection can be relaxed.
     *
     * References used by this algorithm:
     * - DOM Selection API: window.getSelection(), Selection.rangeCount,
     *   Selection.getRangeAt().
     * - DOM Range geometry: Range.getClientRects().
     * - DOM viewport geometry: Element.getBoundingClientRect().
     * - PDF.js PageViewport geometry: convertToPdfPoint() and
     *   convertToViewportRectangle().
     *
     * How to test without PDF.js:
     * - Treat this method as orchestration and extract/mock its geometry inputs:
     *   selection text, selection client rects, page DOM rects, page borders, and
     *   a viewport object exposing width, height, and convertToPdfPoint().
     * - A fake viewport is enough for unit tests, for example:
     *   convertToPdfPoint: (x, y) => [x / scale, (height - y) / scale].
     * - Test the pure cases independently: empty selection, tiny rect filtering,
     *   no page intersection, multi-page rejection, page-local clamping, PDF rect
     *   normalization, and successful draft creation.
     *
     * Critique:
     * - The algorithm depends on browser layout rectangles, so selection geometry
     *   can vary slightly across engines, zoom levels, fonts, and text-layer DOM.
     * - Hit-testing by largest page intersection is robust for continuous scroll,
     *   but it is still a heuristic around page borders and overlapping layout.
     * - Direct DOM and PDFViewerApplication access keeps this orchestration hard
     *   to unit test end-to-end. The pure geometry pieces live in
     *   annotationGeometry.ts; if geometry bugs grow, keep pushing page filtering
     *   and coordinate rules toward that module and leave this method as DOM glue.
     *
     * The rejection policy is intentionally strict. A missing page, missing
     * viewport, or cross-page selection would otherwise create annotations whose
     * persistence shape is ambiguous and difficult to migrate later.
     */
    private selectionToDraft(): TSelectionToDraftResult {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
            debugLog("selection rejected: empty selection", {
                hasSelection: !!selection,
                rangeCount: selection?.rangeCount || 0,
            });
            return {
                reason: "empty",
            };
        }

        const clientRects = this.getSelectionClientRects(selection);
        if (!clientRects.length) {
            debugLog("selection rejected: no usable client rects", {
                quoteLength: selection.toString().length,
            });
            return {
                reason: "no-usable-rects",
            };
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
                return {
                    reason: "missing-page",
                };
            }
            pageNumbers.add(pageHit.pageNumber);
            if (pageNumbers.size > 1) {
                debugLog("selection rejected: selection spans multiple pages", {
                    pages: Array.from(pageNumbers),
                });
                return {
                    reason: "multi-page",
                };
            }
        }

        const page = Array.from(pageNumbers)[0];
        const pageElement = this.getPageElement(page);
        const pageView = this.getPageView(page);
        if (!pageElement) {
            debugLog("selection rejected: missing page element", {
                page,
            });
            return {
                reason: "missing-page",
            };
        }

        if (!pageView?.viewport) {
            debugLog("selection rejected: missing page viewport", {
                page,
                hasViewport: !!pageView?.viewport,
            });
            return {
                reason: "missing-viewport",
            };
        }

        const rects = clientRects
            .map((rect) => this.clientRectToPdfRect(rect, pageElement, pageView))
            .filter((rect): rect is TPdfAnnotationRectTransport => isValidPdfAnnotationRect(rect));

        if (!rects.length) {
            debugLog("selection rejected: no valid PDF rects after conversion", {
                page,
                clientRectCount: clientRects.length,
            });
            return {
                reason: "invalid-rects",
            };
        }

        debugLog("selection converted to PDF annotation draft", {
            page,
            rectCount: rects.length,
        });
        return {
            draft: {
                type: "pdf-text-highlight",
                page,
                rects,
                quote: selection.toString(),
            },
        };
    }

    /**
     * Browser selections may contain several DOM ranges and may include tiny
     * zero-width artifacts around line breaks or glyph boundaries. Filtering
     * sub-pixel rects keeps the stored annotation data focused on visible text.
     */
    private getSelectionClientRects(selection: Selection) {
        const rects: DOMRect[] = [];
        for (let rangeIndex = 0; rangeIndex < selection.rangeCount; rangeIndex++) {
            const range = selection.getRangeAt(rangeIndex);
            const rangeRects = range.getClientRects();
            for (let rectIndex = 0; rectIndex < rangeRects.length; rectIndex++) {
                const rect = rangeRects.item(rectIndex);
                if (rect && isUsableSelectionRect(rect)) {
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

    /**
     * Finds the page with the largest intersection area for a selection rect.
     * Using intersection instead of only checking the rect origin is more robust
     * for line boxes that slightly overlap page padding, borders, or neighboring
     * page containers during continuous scrolling.
     */
    private findPageForClientRect(rect: DOMRect): IPageHit | undefined {
        const pageElements = Array.from(document.querySelectorAll<HTMLElement>(".page[data-page-number]"));
        const pages = pageElements.map((pageElement) => ({
            pageElement,
            pageNumber: Number(pageElement.dataset.pageNumber),
            rect: pageElement.getBoundingClientRect(),
        }));

        return findBestPageForRect(rect, pages);
    }

    /**
     * Converts a DOMRect in viewport/client coordinates into PDF-space geometry.
     *
     * Client rects are relative to the browser viewport, while PDF.js conversion
     * expects coordinates relative to the rendered page viewport. We subtract the
     * page position and its visible borders, clamp to the page viewport, then let
     * PDF.js handle rotation and scale through convertToPdfPoint().
     */
    private clientRectToPdfRect(rect: DOMRect, pageElement: HTMLElement, pageView: any): TPdfAnnotationRectTransport | undefined {
        const viewport = pageView.viewport;
        const pageRect = pageElement.getBoundingClientRect();
        const border = this.getPageBorderWidths(pageElement);
        const viewportWidth = Number(viewport.width) || pageElement.clientWidth;
        const viewportHeight = Number(viewport.height) || pageElement.clientHeight;

        const pageViewportRect = clientRectToPageViewportRect(rect, pageRect, border, {
            width: viewportWidth,
            height: viewportHeight,
        });
        if (!pageViewportRect) {
            debugLog("client rect ignored after page-local clamping", {
                rect: this.describeRect(rect),
            });
            return undefined;
        }

        return pageViewportRectToPdfRect(pageViewportRect, viewport);
    }

    /**
     * Rebuilds all overlay layers from the current canonical snapshot. Full
     * rebuilds are acceptable for the MVP and reduce edge cases around removed
     * annotations, scale changes, and recycled PDF.js page DOM.
     */
    private renderAll() {
        this.removeAllOverlayLayers();
        if (!this.annotationsVisible) {
            debugLog("renderAll skipped: annotations hidden");
            return;
        }

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

    /**
     * Renders the annotations belonging to one PDF page. The overlay layer is
     * recreated for that page so a page render never accumulates stale children
     * from a previous viewport, zoom level, or annotation snapshot.
     *
     * Design rationale:
     * - The host snapshot is canonical, but PDF.js owns the page DOM. Rendering
     *   therefore happens only when both the page element and the PDF.js page
     *   viewport are available.
     * - PDF.js may recycle or re-render page DOM after zoom, rotation, or lazy
     *   page rendering. Removing this controller's previous overlay before
     *   appending a new one makes each page render idempotent.
     * - Filtering annotations by page keeps the first slice simple and matches
     *   the persisted first-slice target shape: one annotation target has one
     *   1-based page number plus one or more PDF-space rectangles.
     * - Overlay children are derived from persisted PDF coordinates with
     *   createHighlightElement(), which lets PDF.js PageViewport handle current
     *   scale and rotation when converting back to viewport coordinates.
     *
     * How to test without PDF.js:
     * - Mock getPageElement() with an HTMLElement-like page container exposing
     *   append(), children, and a classList on existing overlay nodes.
     * - Mock getPageView() with a viewport exposing convertToViewportRectangle().
     * - Seed this.annotations with page-matched and page-mismatched annotations.
     * - Assert that a missing page element or viewport produces no DOM mutation.
     * - Assert that an existing annotation overlay is removed before rendering.
     * - Assert that only annotations for the requested page create highlight
     *   children and that invalid/tiny viewport rectangles are skipped.
     *
     * Critique:
     * - This intentionally rebuilds a page overlay instead of diffing children.
     *   That is simpler and safer for the MVP, but less efficient if a page has
     *   many annotations or if PDF.js emits frequent render events.
     * - The layer is passive and aria-hidden, so it cannot support selection,
     *   focus, or keyboard interaction until later slices redefine the overlay
     *   interaction model.
     * - The method still depends on PDF.js page DOM shape and viewport APIs. If
     *   PDF.js integration changes or rendering needs richer interactions, keep
     *   moving page filtering, layer reconciliation, and viewport conversion into
     *   smaller tested helpers.
     */
    private renderPage(pageNumber: number) {
        if (!this.annotationsVisible) {
            const pageElement = this.getPageElement(pageNumber);
            if (pageElement) {
                this.removeOverlayLayer(pageElement);
            }
            debugLog("renderPage skipped: annotations hidden", { pageNumber });
            return;
        }

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
            for (const [rectIndex, rect] of annotation.rects.entries()) {
                const highlight = this.createHighlightElement(annotation, rect, rectIndex, pageView);
                if (highlight) {
                    layer.append(highlight);
                }
            }
        }
    }

    /**
     * Creates a passive overlay above the PDF page contents. Pointer events stay
     * disabled because selection and PDF.js controls must remain reachable in
     * this first pass; future interactive annotations can revise this boundary.
     */
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

    /**
     * Converts persisted PDF-space geometry to the current viewport rectangle
     * and paints it with the host-owned annotation color and draw type.
     *
     * Opacity remains a webview rendering policy instead of persisted data:
     * solid highlights use a translucent fill, while underline, strike-through,
     * and outline are rendered as opaque strokes.
     */
    private createHighlightElement(
        annotation: TPdfAnnotationTransport,
        rect: TPdfAnnotationRectTransport,
        rectIndex: number,
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
        highlight.dataset.annotationPage = String(annotation.page);
        highlight.dataset.annotationRectIndex = String(rectIndex);
        highlight.style.position = "absolute";
        highlight.style.left = `${left}px`;
        highlight.style.top = `${top}px`;
        highlight.style.width = `${width}px`;
        highlight.style.height = `${height}px`;
        highlight.style.pointerEvents = "none";
        this.applyHighlightStyle(highlight, annotation);

        return highlight;
    }

    private applyHighlightStyle(highlight: HTMLElement, annotation: TPdfAnnotationTransport) {
        const color = colorToCss(annotation.color);
        const drawType = normalizePdfAnnotationDrawType(annotation.drawType);

        highlight.dataset.drawType = drawType;
        highlight.style.boxSizing = "border-box";

        if (drawType === "underline") {
            highlight.style.backgroundColor = "transparent";
            highlight.style.borderBottom = `2px solid ${color}`;
            return;
        }

        if (drawType === "strikethrough") {
            highlight.style.backgroundColor = "transparent";
            highlight.style.borderTop = `2px solid ${color}`;
            highlight.style.transform = "translateY(50%)";
            return;
        }

        if (drawType === "outline") {
            highlight.style.backgroundColor = "transparent";
            highlight.style.border = `2px solid ${color}`;
            return;
        }

        highlight.style.backgroundColor = color;
        highlight.style.opacity = HIGHLIGHT_OPACITY;
        highlight.style.mixBlendMode = "multiply";
    }

    private shouldShowClickableAnnotationCursor(event: PointerEvent | MouseEvent) {
        if (!this.annotationsVisible) {
            return false;
        }

        if ("buttons" in event && event.buttons !== 0) {
            return false;
        }

        if (!this.clickOriginatesInPdfPage(event)) {
            return false;
        }

        if (window.getSelection?.()?.toString().trim()) {
            return false;
        }

        return !!this.findAnnotationClickCandidate(event.clientX, event.clientY);
    }

    private setAnnotationHoverCursor(active: boolean) {
        document.documentElement.classList.toggle(ANNOTATION_CLICKABLE_CURSOR_CLASS, active);
    }

    private ensureClickableCursorStyle() {
        if (document.getElementById(ANNOTATION_CLICKABLE_CURSOR_STYLE_ID)) {
            return;
        }

        const style = document.createElement("style");
        style.id = ANNOTATION_CLICKABLE_CURSOR_STYLE_ID;
        style.textContent = `
html.${ANNOTATION_CLICKABLE_CURSOR_CLASS},
html.${ANNOTATION_CLICKABLE_CURSOR_CLASS} body,
html.${ANNOTATION_CLICKABLE_CURSOR_CLASS} .page,
html.${ANNOTATION_CLICKABLE_CURSOR_CLASS} .page * {
    cursor: pointer !important;
}
`;
        document.head.append(style);
    }

    private removeClickableCursorStyle() {
        document.getElementById(ANNOTATION_CLICKABLE_CURSOR_STYLE_ID)?.remove();
    }

    private getDraftSignature(draft: TPdfAnnotationDraftTransport) {
        return JSON.stringify({
            page: draft.page,
            rects: draft.rects,
            quote: draft.quote || "",
        });
    }

    private clearInstantAnnotationTimer() {
        if (typeof this.instantAnnotationTimer === "number") {
            window.clearTimeout(this.instantAnnotationTimer);
            this.instantAnnotationTimer = undefined;
        }
    }

    private selectionTargetFromClick(event: MouseEvent): TPdfAnnotationSelectionTarget | undefined {
        if (!this.annotationsVisible) {
            return undefined;
        }

        if (event.button !== 0) {
            return undefined;
        }

        if (this.annotationPointerDown?.button !== 0) {
            return undefined;
        }

        if (this.annotationPointerDown) {
            const movement = Math.hypot(
                event.clientX - this.annotationPointerDown.x,
                event.clientY - this.annotationPointerDown.y,
            );
            if (movement > 4) {
                debugLog("annotation click ignored after pointer movement", { movement });
                return undefined;
            }
        }

        if (!this.clickOriginatesInPdfPage(event)) {
            return undefined;
        }

        const candidate = this.findAnnotationClickCandidate(event.clientX, event.clientY);
        if (!candidate) {
            return undefined;
        }

        if (!event.shiftKey && window.getSelection?.()?.toString().trim()) {
            debugLog("annotation click ignored while text selection is active");
            return undefined;
        }

        return {
            id: candidate.annotation.id,
            page: candidate.annotation.page,
            rectIndex: candidate.rectIndex,
            rect: { ...candidate.rect },
            source: "overlay-click",
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
        };
    }

    private findAnnotationClickCandidate(clientX: number, clientY: number): IAnnotationClickCandidate | undefined {
        const highlights = Array.from(document.querySelectorAll<HTMLElement>(`.${ANNOTATION_HIGHLIGHT_CLASS}`));
        let bestCandidate: IAnnotationClickCandidate | undefined;

        highlights.forEach((highlight, order) => {
            const annotationId = highlight.dataset.annotationId;
            const annotation = annotationId ? this.annotations.get(annotationId) : undefined;
            const rectIndex = Number(highlight.dataset.annotationRectIndex);
            if (!annotation || !Number.isInteger(rectIndex) || rectIndex < 0) {
                return;
            }

            const rect = annotation.rects[rectIndex];
            if (!rect) {
                return;
            }

            const bounds = highlight.getBoundingClientRect();
            if (!this.pointIsInsideRect(clientX, clientY, bounds)) {
                return;
            }

            const width = Math.max(0, bounds.width || bounds.right - bounds.left);
            const height = Math.max(0, bounds.height || bounds.bottom - bounds.top);
            const area = Math.max(1, width * height);
            const distanceFromCenter = Math.hypot(
                clientX - (bounds.left + (width / 2)),
                clientY - (bounds.top + (height / 2)),
            );
            const candidate: IAnnotationClickCandidate = {
                annotation,
                area,
                distanceFromCenter,
                order,
                rect,
                rectIndex,
            };

            if (
                !bestCandidate ||
                candidate.area < bestCandidate.area ||
                (candidate.area === bestCandidate.area && candidate.distanceFromCenter < bestCandidate.distanceFromCenter) ||
                (
                    candidate.area === bestCandidate.area &&
                    candidate.distanceFromCenter === bestCandidate.distanceFromCenter &&
                    candidate.order > bestCandidate.order
                )
            ) {
                bestCandidate = candidate;
            }
        });

        return bestCandidate;
    }

    private clickOriginatesInPdfPage(event: MouseEvent) {
        const target = event.target;
        if (target instanceof window.HTMLElement && target.closest(".page[data-page-number]")) {
            return true;
        }

        const elementAtPoint = document.elementFromPoint?.(event.clientX, event.clientY);
        return elementAtPoint instanceof window.HTMLElement && !!elementAtPoint.closest(".page[data-page-number]");
    }

    private pointIsInsideRect(clientX: number, clientY: number, rect: DOMRect) {
        return [clientX, clientY, rect.left, rect.top, rect.right, rect.bottom].every(Number.isFinite) &&
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom;
    }

    /**
     * Defers a full redraw across two animation frames after geometry changes.
     * PDF.js can update page transforms and dimensions asynchronously, so the
     * extra frame reduces the chance of measuring an intermediate viewport.
     */
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

    /**
     * Returns the PDF.js page view for a 1-based page number. Prefer the public
     * getPageView() method when available, with the private _pages array as a
     * compatibility fallback for embedded PDF.js versions used by Thorium.
     */
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

    /**
     * PDF.js page elements are the stable DOM anchor for both selection hit
     * testing and overlay insertion. The data-page-number attribute is part of
     * PDF.js' rendered page structure and is already 1-based.
     */
    private getPageElement(pageNumber: number) {
        return document.querySelector<HTMLElement>(`.page[data-page-number="${pageNumber}"]`);
    }

    /**
     * Page borders are visible layout chrome, not PDF content. Removing their
     * width from client coordinates keeps the converted rect aligned with the
     * actual PDF viewport.
     */
    private getPageBorderWidths(pageElement: HTMLElement) {
        const style = window.getComputedStyle(pageElement);

        return {
            left: parseFloat(style.borderLeftWidth) || 0,
            top: parseFloat(style.borderTopWidth) || 0,
        };
    }

    /**
     * Removes every overlay layer owned by this controller. This is used for
     * snapshot replacement, geometry invalidation, and final teardown.
     */
    private removeAllOverlayLayers() {
        document.querySelectorAll<HTMLElement>(`.${ANNOTATION_LAYER_CLASS}`).forEach((layer) => layer.remove());
    }

    /**
     * Removes only this controller's overlay layer from one page. Page-level
     * redraws use this to avoid disturbing unrelated PDF.js DOM.
     */
    private removeOverlayLayer(pageElement: HTMLElement) {
        Array.from(pageElement.children)
            .filter((child) => child.classList.contains(ANNOTATION_LAYER_CLASS))
            .forEach((child) => child.remove());
    }

    /**
     * Registers a PDF.js EventBus listener across supported API shapes. Listener
     * registration is best-effort because the webview can initialize before the
     * PDF application object is fully ready; explicit logs make that visible.
     */
    private addPdfJsListener(key: string, fn: (payload?: any) => void) {
        const eventBus = this.getPdfViewerApplication()?.eventBus;
        if (!eventBus) {
            console.error(DEBUG_PREFIX, "PDF.js listener not registered: missing event bus", { key });
            return;
        }

        if (typeof eventBus.on === "function") {
            eventBus.on(key, fn);
        } else if (typeof eventBus._on === "function") {
            eventBus._on(key, fn);
        } else {
            console.error(DEBUG_PREFIX, "PDF.js listener not registered: no compatible on method", { key });
            return;
        }

        debugLog("PDF.js listener registered", { key });
        this.pdfJsListeners.push({ key, fn });
    }

    /**
     * Removes a previously registered PDF.js EventBus listener. Missing removal
     * APIs are logged but not thrown because teardown should never block webview
     * navigation or document unload.
     */
    private removePdfJsListener(key: string, fn: (payload?: any) => void) {
        const eventBus = this.getPdfViewerApplication()?.eventBus;
        if (!eventBus) {
            console.error(DEBUG_PREFIX, "PDF.js listener not removed: missing event bus", { key });
            return;
        }

        if (typeof eventBus.off === "function") {
            eventBus.off(key, fn);
        } else if (typeof eventBus._off === "function") {
            eventBus._off(key, fn);
        } else {
            console.error(DEBUG_PREFIX, "PDF.js listener not removed: no compatible off method", { key });
        }
    }

    /**
     * Normalizes DOMRect logging so debug output stays serializable and easy to
     * compare across browsers.
     */
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

/**
 * Factory kept as the webview composition boundary. index_pdf.ts wires the real
 * bus and PDF.js application lookup, while tests or future slices can inject
 * substitutes without constructing globals inside the controller itself.
 */
export function createPdfAnnotationController(
    bus: IEventBusPdfPlayer,
    getPdfViewerApplication: () => IPdfViewerApplication | undefined,
) {
    return new PdfAnnotationController(bus, getPdfViewerApplication);
}
