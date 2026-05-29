import { expect, jest, test, beforeEach, afterEach } from "@jest/globals";
import { JSDOM } from "jsdom";

import type {
    IEventBusPdfPlayer,
} from "readium-desktop/renderer/reader/pdf/common/pdfReader.type";
import type { TPdfAnnotationTransport } from "readium-desktop/renderer/reader/pdf/common/pdfAnnotation.type";
import { PdfAnnotationController } from "readium-desktop/renderer/reader/pdf/webview/annotations";

const ANNOTATION_CLICKABLE_CURSOR_CLASS = "thorium-pdf-annotation-clickable-cursor";
const ANNOTATION_CLICKABLE_CURSOR_STYLE_ID = "thorium-pdf-annotation-clickable-cursor-style";

type THandler = (...args: any[]) => void;

class FakeThoriumBus {
    public readonly dispatches: Array<{
        key: string;
        args: any[];
    }> = [];

    private readonly handlers = new Map<string, THandler[]>();

    public subscribe(key: string, fn: THandler) {
        this.handlers.set(key, [...(this.handlers.get(key) || []), fn]);
    }

    public dispatch(key: string, ...args: any[]) {
        this.dispatches.push({ key, args });
        for (const fn of this.handlers.get(key) || []) {
            fn(...args);
        }
    }

    public remove(fn: THandler, key?: string) {
        if (key) {
            this.handlers.set(
                key,
                (this.handlers.get(key) || []).filter((handler) => handler !== fn),
            );
            return;
        }

        for (const [handlerKey, handlers] of this.handlers) {
            this.handlers.set(
                handlerKey,
                handlers.filter((handler) => handler !== fn),
            );
        }
    }

    public removeKey(key: string) {
        this.handlers.delete(key);
    }

    public listenerCount(key: string) {
        return this.handlers.get(key)?.length || 0;
    }
}

class FakePdfJsEventBus {
    private readonly handlers = new Map<string, THandler[]>();

    public on(key: string, fn: THandler) {
        this.handlers.set(key, [...(this.handlers.get(key) || []), fn]);
    }

    public off(key: string, fn: THandler) {
        this.handlers.set(
            key,
            (this.handlers.get(key) || []).filter((handler) => handler !== fn),
        );
    }

    public emit(key: string, payload?: any) {
        for (const fn of this.handlers.get(key) || []) {
            fn(payload);
        }
    }

    public listenerCount(key: string) {
        return this.handlers.get(key)?.length || 0;
    }
}

class FakePrivatePdfJsEventBus {
    private readonly handlers = new Map<string, THandler[]>();

    public _on(key: string, fn: THandler) {
        this.handlers.set(key, [...(this.handlers.get(key) || []), fn]);
    }

    public _off(key: string, fn: THandler) {
        this.handlers.set(
            key,
            (this.handlers.get(key) || []).filter((handler) => handler !== fn),
        );
    }

    public emit(key: string, payload?: any) {
        for (const fn of this.handlers.get(key) || []) {
            fn(payload);
        }
    }

    public listenerCount(key: string) {
        return this.handlers.get(key)?.length || 0;
    }
}

interface IRenderedPage {
    pageElement: HTMLElement;
    pageView: any;
}

let dom: JSDOM;
let rafCallbacks: Array<(time: number) => void>;

beforeEach(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>");
    rafCallbacks = [];

    Object.defineProperty(globalThis, "window", {
        value: dom.window,
        configurable: true,
    });
    Object.defineProperty(globalThis, "document", {
        value: dom.window.document,
        configurable: true,
    });

    dom.window.requestAnimationFrame = ((callback: (time: number) => void) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
    }) as any;
    dom.window.cancelAnimationFrame = ((handle: number) => {
        rafCallbacks[handle - 1] = () => undefined;
    }) as any;

    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
    jest.restoreAllMocks();
    dom.window.close();
});

function rect(left: number, top: number, right: number, bottom: number) {
    return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
    };
}

function createRenderedPage(
    pageNumber: number,
    options: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
        borderLeft?: number;
        borderTop?: number;
        viewport?: any;
    } = {},
): IRenderedPage {
    const left = options.left ?? 100;
    const top = options.top ?? 50;
    const width = options.width ?? 600;
    const height = options.height ?? 800;
    const pageElement = document.createElement("div");
    pageElement.className = "page";
    pageElement.dataset.pageNumber = String(pageNumber);
    pageElement.style.position = "relative";
    pageElement.style.borderLeftWidth = `${options.borderLeft ?? 0}px`;
    pageElement.style.borderTopWidth = `${options.borderTop ?? 0}px`;

    Object.defineProperty(pageElement, "getBoundingClientRect", {
        value: () => rect(left, top, left + width, top + height),
    });
    Object.defineProperty(pageElement, "clientWidth", {
        value: width,
        configurable: true,
    });
    Object.defineProperty(pageElement, "clientHeight", {
        value: height,
        configurable: true,
    });
    document.body.append(pageElement);

    return {
        pageElement,
        pageView: {
            viewport: options.viewport || {
                width,
                height,
                convertToPdfPoint: (x: number, y: number) => [x / 2, (height - y) / 2],
                convertToViewportRectangle: ([x1, y1, x2, y2]: number[]) => [x1, y1, x2, y2],
            },
        },
    };
}

function createHarness(
    renderedPages: IRenderedPage[] = [],
    options: {
        pdfJsEventBus?: FakePdfJsEventBus | FakePrivatePdfJsEventBus;
    } = {},
) {
    const thoriumBus = new FakeThoriumBus();
    const pdfJsEventBus = options.pdfJsEventBus || new FakePdfJsEventBus();
    const pageViews = renderedPages.map((page) => page.pageView);
    const app = {
        eventBus: pdfJsEventBus,
        pdfViewer: {
            pagesCount: pageViews.length,
            getPageView: (index: number) => pageViews[index],
            scrollPageIntoView: jest.fn(),
        },
    };
    const controller = new PdfAnnotationController(thoriumBus as unknown as IEventBusPdfPlayer, () => app as any);

    return {
        app,
        controller,
        pdfJsEventBus,
        thoriumBus,
    };
}

function annotation(
    id: string,
    page: number,
    rects = [{ x1: 10, y1: 20, x2: 30, y2: 40 }],
    overrides: Partial<TPdfAnnotationTransport> = {},
): TPdfAnnotationTransport {
    return {
        id,
        type: "pdf-text-highlight",
        page,
        rects,
        quote: `quote-${id}`,
        color: {
            red: 254,
            green: 243,
            blue: 189,
        },
        drawType: "solid_background",
        ...overrides,
    };
}

function overlayLayers(pageElement?: HTMLElement) {
    return Array.from((pageElement || document.body).querySelectorAll<HTMLElement>(".thorium-pdf-annotation-layer"));
}

function highlights(pageElement?: HTMLElement) {
    return Array.from(
        (pageElement || document.body).querySelectorAll<HTMLElement>(".thorium-pdf-annotation-highlight"),
    );
}

function setSelection(text: string, rangeRects: Array<Array<ReturnType<typeof rect>>>) {
    const selection = {
        rangeCount: rangeRects.length,
        toString: () => text,
        getRangeAt: (rangeIndex: number) => ({
            getClientRects: () => ({
                length: rangeRects[rangeIndex].length,
                item: (rectIndex: number) => rangeRects[rangeIndex][rectIndex] || null,
            }),
        }),
    };

    Object.defineProperty(window, "getSelection", {
        value: () => selection,
        configurable: true,
    });
}

function latestDraftDispatch(thoriumBus: FakeThoriumBus) {
    return thoriumBus.dispatches.filter((dispatch) => dispatch.key === "annotation:create-requested").at(-1);
}

function latestSelectedDispatch(thoriumBus: FakeThoriumBus) {
    return thoriumBus.dispatches.filter((dispatch) => dispatch.key === "annotation:selected").at(-1);
}

function latestSelectionErrorDispatch(thoriumBus: FakeThoriumBus) {
    return thoriumBus.dispatches.filter((dispatch) => dispatch.key === "annotation:selection-error").at(-1);
}

function setHighlightClientRect(annotationId: string, clientRect: ReturnType<typeof rect>) {
    const highlight = highlights().find((item) => item.dataset.annotationId === annotationId);
    if (!highlight) {
        throw new Error(`Expected rendered highlight for ${annotationId}`);
    }

    Object.defineProperty(highlight, "getBoundingClientRect", {
        value: () => clientRect,
        configurable: true,
    });
}

function dispatchAnnotationClick(
    x: number,
    y: number,
    options: {
        button?: number;
        pointerDownX?: number;
        pointerDownY?: number;
        shiftKey?: boolean;
        altKey?: boolean;
        ctrlKey?: boolean;
        metaKey?: boolean;
        target?: EventTarget;
    } = {},
) {
    const target = options.target || document;
    target.dispatchEvent(
        new window.MouseEvent("pointerdown", {
            bubbles: true,
            button: options.button ?? 0,
            clientX: options.pointerDownX ?? x,
            clientY: options.pointerDownY ?? y,
        }),
    );
    target.dispatchEvent(
        new window.MouseEvent("click", {
            bubbles: true,
            button: options.button ?? 0,
            clientX: x,
            clientY: y,
            shiftKey: !!options.shiftKey,
            altKey: !!options.altKey,
            ctrlKey: !!options.ctrlKey,
            metaKey: !!options.metaKey,
        }),
    );
}

function dispatchAnnotationPointerMove(
    x: number,
    y: number,
    options: {
        buttons?: number;
        target?: EventTarget;
    } = {},
) {
    const target = options.target || document;
    target.dispatchEvent(
        new window.MouseEvent("pointermove", {
            bubbles: true,
            buttons: options.buttons ?? 0,
            clientX: x,
            clientY: y,
        }),
    );
}

function dispatchSelectionChange() {
    document.dispatchEvent(
        new window.Event("selectionchange", {
            bubbles: true,
        }),
    );
}

function runNextAnimationFrame() {
    const callback = rafCallbacks.shift();
    if (callback) {
        callback(0);
    }
}

function mockScrollIntoView(scrolledElements: HTMLElement[]) {
    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value(this: HTMLElement) {
            scrolledElements.push(this);
        },
    });
}

test("init subscribes to Thorium and PDF.js events only once", () => {
    const harness = createHarness();

    harness.controller.init();
    harness.controller.init();

    expect(harness.thoriumBus.listenerCount("annotations:sync")).toBe(1);
    expect(harness.thoriumBus.listenerCount("annotations:set-instant-mode")).toBe(1);
    expect(harness.thoriumBus.listenerCount("annotations:set-visibility")).toBe(1);
    expect(harness.thoriumBus.listenerCount("highlight:create-from-selection")).toBe(1);
    expect(harness.thoriumBus.listenerCount("viewer:go-to-annotation")).toBe(1);
    expect(harness.thoriumBus.listenerCount("annotation:selection-error")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("pagesinit")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("documentloaded")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("pagerendered")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("scalechanging")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("rotationchanging")).toBe(1);
});

test("init and destroy support private PDF.js event bus methods", () => {
    const pdfJsEventBus = new FakePrivatePdfJsEventBus();
    const harness = createHarness([], {
        pdfJsEventBus,
    });

    harness.controller.init();
    expect(pdfJsEventBus.listenerCount("pagesinit")).toBe(1);
    expect(pdfJsEventBus.listenerCount("documentloaded")).toBe(1);
    expect(pdfJsEventBus.listenerCount("pagerendered")).toBe(1);

    harness.controller.destroy();
    expect(pdfJsEventBus.listenerCount("pagesinit")).toBe(0);
    expect(pdfJsEventBus.listenerCount("documentloaded")).toBe(0);
    expect(pdfJsEventBus.listenerCount("pagerendered")).toBe(0);
});

test("debug logs are disabled by default, opt-in through a flag, and errors stay visible", () => {
    const harness = createHarness();

    harness.controller.init();
    expect(console.log).not.toHaveBeenCalled();

    harness.thoriumBus.dispatch("annotations:sync", undefined);
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "annotations:sync ignored invalid payload",
        undefined,
    );

    harness.controller.destroy();
    (window as any).__THORIUM_PDF_ANNOTATIONS_DEBUG = true;
    harness.controller.init();
    expect(console.log).toHaveBeenCalledWith("[Thorium PDF annotations]", "init");
});

test("annotations:sync replaces the snapshot, ignores missing ids, and empty sync clears overlays", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["first"]);

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [{ ...annotation("missing", 1), id: "" }, annotation("second", 1)],
    });
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["second"]);
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "annotations:sync ignored annotation without id",
        expect.objectContaining({ id: "" }),
    );

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [],
    });
    expect(overlayLayers()).toEqual([]);
});

test("annotations:sync ignores invalid payloads without clearing the current snapshot", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["first"]);

    expect(() => harness.thoriumBus.dispatch("annotations:sync", undefined)).not.toThrow();
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["first"]);

    expect(() =>
        harness.thoriumBus.dispatch("annotations:sync", {
            annotations: "not-an-array",
        }),
    ).not.toThrow();
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["first"]);
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "annotations:sync ignored invalid payload",
        undefined,
    );
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "annotations:sync ignored invalid payload",
        { annotations: "not-an-array" },
    );
});

test("highlight:create-from-selection does not dispatch a draft for an empty selection", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("   ", [[rect(150, 100, 250, 120)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
    expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
        source: "highlight:create-from-selection",
        reason: "empty",
    });
});

test("highlight:create-from-selection rejects selections whose rects are too small", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("tiny", [[rect(150, 100, 150.5, 120)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
    expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
        source: "highlight:create-from-selection",
        reason: "no-usable-rects",
    });
});

test("highlight:create-from-selection rejects a selection that does not intersect a PDF page", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("outside", [[rect(900, 900, 950, 930)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
    expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
        source: "highlight:create-from-selection",
        reason: "missing-page",
    });
});

test("highlight:create-from-selection rejects multi-page selections", () => {
    const first = createRenderedPage(1, { left: 100, top: 50 });
    const second = createRenderedPage(2, { left: 100, top: 900 });
    const harness = createHarness([first, second]);
    harness.controller.init();
    setSelection("two pages", [[rect(150, 100, 250, 120), rect(150, 950, 250, 970)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
    expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
        source: "highlight:create-from-selection",
        reason: "multi-page",
    });
});

test("highlight:create-from-selection rejects when the page element disappears before conversion", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    const originalQuerySelector = document.querySelector.bind(document);
    jest.spyOn(document, "querySelector").mockImplementation((selector: string) => {
        if (selector.includes("data-page-number") && selector.includes("1")) {
            return null;
        }
        return originalQuerySelector(selector);
    });
    harness.controller.init();
    setSelection("missing page element", [[rect(150, 100, 250, 120)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
    expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
        source: "highlight:create-from-selection",
        reason: "missing-page",
    });
});

test("highlight:create-from-selection rejects when the PDF.js viewport is missing", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([
        {
            pageElement: page.pageElement,
            pageView: {},
        },
    ]);
    harness.controller.init();
    setSelection("missing viewport", [[rect(150, 100, 250, 120)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
    expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
        source: "highlight:create-from-selection",
        reason: "missing-viewport",
    });
});

test("highlight:create-from-selection rejects when conversion leaves no valid PDF rects", () => {
    const page = createRenderedPage(1, {
        viewport: {
            width: 10,
            height: 10,
            convertToPdfPoint: (x: number, y: number) => [x, y],
            convertToViewportRectangle: ([x1, y1, x2, y2]: number[]) => [x1, y1, x2, y2],
        },
    });
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("outside viewport but inside page", [[rect(650, 700, 690, 720)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
    expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
        source: "highlight:create-from-selection",
        reason: "invalid-rects",
    });
});

test("highlight:create-from-selection dispatches a one-page PDF draft for a valid selection", () => {
    const page = createRenderedPage(1, {
        borderLeft: 10,
        borderTop: 5,
    });
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("selected quote", [[rect(150, 100, 250, 120)]]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    const draftDispatch = latestDraftDispatch(harness.thoriumBus);
    expect(draftDispatch?.args[0]).toEqual({
        draft: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                {
                    x1: 20,
                    y1: 367.5,
                    x2: 70,
                    y2: 377.5,
                },
            ],
            quote: "selected quote",
        },
        source: "highlight:create-from-selection",
    });
    expect(draftDispatch?.args[0].draft).not.toHaveProperty("id");
    expect(draftDispatch?.args[0].draft).not.toHaveProperty("created");
    expect(draftDispatch?.args[0].draft).not.toHaveProperty("creator");
    expect(draftDispatch?.args[0].draft).not.toHaveProperty("color");
    expect(draftDispatch?.args[0].draft).not.toHaveProperty("drawType");
});

test("annotations:ready is dispatched once when PDF geometry becomes available", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.pdfJsEventBus.emit("pagesinit");
    harness.pdfJsEventBus.emit("documentloaded");

    expect(harness.thoriumBus.dispatches.filter((dispatch) => dispatch.key === "annotations:ready")).toHaveLength(1);
});

test("pagerendered renders one reported page and falls back to full render without page number", () => {
    const first = createRenderedPage(1);
    const second = createRenderedPage(2);
    const harness = createHarness([first, second]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1), annotation("second", 2)],
    });

    overlayLayers().forEach((layer) => layer.remove());
    harness.pdfJsEventBus.emit("pagerendered", { pageNumber: 2 });
    expect(overlayLayers(first.pageElement)).toHaveLength(0);
    expect(overlayLayers(second.pageElement)).toHaveLength(1);

    overlayLayers().forEach((layer) => layer.remove());
    harness.pdfJsEventBus.emit("pagerendered", {});
    expect(overlayLayers(first.pageElement)).toHaveLength(1);
    expect(overlayLayers(second.pageElement)).toHaveLength(1);
});

test("scale or rotation changes remove stale overlays before scheduled redraw", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    expect(overlayLayers()).toHaveLength(1);

    harness.pdfJsEventBus.emit("scalechanging");

    expect(overlayLayers()).toHaveLength(0);
    runNextAnimationFrame();
    expect(overlayLayers()).toHaveLength(0);
    runNextAnimationFrame();
    expect(overlayLayers()).toHaveLength(1);
});

test("destroy removes subscriptions, clears overlays and state, and cancels scheduled renders", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    harness.pdfJsEventBus.emit("rotationchanging");
    const removeDocumentListenerSpy = jest.spyOn(document, "removeEventListener");

    harness.controller.destroy();
    runNextAnimationFrame();
    runNextAnimationFrame();

    expect(harness.thoriumBus.listenerCount("annotations:sync")).toBe(0);
    expect(harness.thoriumBus.listenerCount("annotations:set-instant-mode")).toBe(0);
    expect(harness.thoriumBus.listenerCount("annotations:set-visibility")).toBe(0);
    expect(harness.thoriumBus.listenerCount("highlight:create-from-selection")).toBe(0);
    expect(harness.thoriumBus.listenerCount("viewer:go-to-annotation")).toBe(0);
    expect(harness.thoriumBus.listenerCount("annotation:selection-error")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("pagesinit")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("documentloaded")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("pagerendered")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("scalechanging")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("rotationchanging")).toBe(0);
    expect(removeDocumentListenerSpy).toHaveBeenCalledWith("selectionchange", expect.any(Function), true);
    expect(removeDocumentListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function), true);
    expect(removeDocumentListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function), true);
    expect(removeDocumentListenerSpy).toHaveBeenCalledWith("pointerleave", expect.any(Function), true);
    expect(removeDocumentListenerSpy).toHaveBeenCalledWith("click", expect.any(Function), true);
    expect(overlayLayers()).toHaveLength(0);
    expect(document.documentElement.classList.contains(ANNOTATION_CLICKABLE_CURSOR_CLASS)).toBe(false);
    expect(document.getElementById(ANNOTATION_CLICKABLE_CURSOR_STYLE_ID)).toBeNull();

    harness.controller.init();
    harness.pdfJsEventBus.emit("pagerendered", { pageNumber: 1 });
    expect(overlayLayers()).toHaveLength(0);
});

test("overlay rendering creates passive page layers and positioned highlights for valid rects only", () => {
    const first = createRenderedPage(1);
    const second = createRenderedPage(2);
    const harness = createHarness([first, second]);
    harness.controller.init();

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [
            annotation("first", 1, [
                { x1: 10, y1: 20, x2: 30, y2: 40 },
                { x1: 50, y1: 60, x2: 50.25, y2: 80 },
            ]),
            annotation("second", 2, [{ x1: 100, y1: 120, x2: 150, y2: 160 }]),
        ],
    });

    const firstLayers = overlayLayers(first.pageElement);
    const secondLayers = overlayLayers(second.pageElement);
    const firstHighlights = highlights(first.pageElement);
    const secondHighlights = highlights(second.pageElement);

    expect(firstLayers).toHaveLength(1);
    expect(secondLayers).toHaveLength(1);
    expect(firstLayers[0].getAttribute("aria-hidden")).toBe("true");
    expect(firstLayers[0].style.pointerEvents).toBe("none");
    expect(firstHighlights).toHaveLength(1);
    expect(secondHighlights).toHaveLength(1);

    expect(firstHighlights[0].dataset.annotationId).toBe("first");
    expect(firstHighlights[0].style.pointerEvents).toBe("none");
    expect(firstHighlights[0].style.left).toBe("10px");
    expect(firstHighlights[0].style.top).toBe("20px");
    expect(firstHighlights[0].style.width).toBe("20px");
    expect(firstHighlights[0].style.height).toBe("20px");
    expect(firstHighlights[0].style.backgroundColor).toBe("rgb(254, 243, 189)");
    expect(firstHighlights[0].style.opacity).toBe("0.35");

    harness.pdfJsEventBus.emit("pagerendered", { pageNumber: 1 });
    expect(overlayLayers(first.pageElement)).toHaveLength(1);
});

test("annotations:set-visibility hides and restores PDF overlays without dropping the snapshot", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    expect(highlights(page.pageElement)).toHaveLength(1);

    harness.thoriumBus.dispatch("annotations:set-visibility", {
        visible: false,
    });
    expect(overlayLayers(page.pageElement)).toHaveLength(0);

    harness.pdfJsEventBus.emit("pagerendered", { pageNumber: 1 });
    expect(overlayLayers(page.pageElement)).toHaveLength(0);

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("second", 1)],
    });
    expect(overlayLayers(page.pageElement)).toHaveLength(0);

    harness.thoriumBus.dispatch("annotations:set-visibility", {
        visible: true,
    });
    expect(highlights(page.pageElement).map((highlight) => highlight.dataset.annotationId)).toEqual(["second"]);
});

test("annotations:set-visibility rejects invalid payloads without changing visibility", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    harness.thoriumBus.dispatch("annotations:set-visibility", {
        visible: false,
    });
    expect(overlayLayers(page.pageElement)).toHaveLength(0);

    harness.thoriumBus.dispatch("annotations:set-visibility", {
        visible: "yes",
    } as any);
    harness.pdfJsEventBus.emit("pagerendered", {
        pageNumber: 1,
    });

    expect(overlayLayers(page.pageElement)).toHaveLength(0);
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "annotations:set-visibility ignored invalid payload",
        { visible: "yes" },
    );
});

test("hidden PDF overlays cannot be selected and do not show the clickable cursor", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    setHighlightClientRect("first", rect(110, 120, 150, 160));

    harness.thoriumBus.dispatch("annotations:set-visibility", {
        visible: false,
    });
    dispatchAnnotationPointerMove(130, 140, { target: page.pageElement });
    dispatchAnnotationClick(130, 140, { target: page.pageElement });

    expect(document.documentElement.classList.contains(ANNOTATION_CLICKABLE_CURSOR_CLASS)).toBe(false);
    expect(latestSelectedDispatch(harness.thoriumBus)).toBeUndefined();
});

test("annotations:set-instant-mode rejects invalid payloads without enabling instant creation", () => {
    jest.useFakeTimers();
    try {
        const page = createRenderedPage(1);
        const harness = createHarness([page]);
        harness.controller.init();
        harness.thoriumBus.dispatch("annotations:set-instant-mode", {
            enabled: "yes",
        } as any);
        setSelection("instant quote", [[rect(150, 100, 250, 120)]]);

        dispatchSelectionChange();
        jest.advanceTimersByTime(300);

        expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
            "[Thorium PDF annotations]",
            "annotations:set-instant-mode ignored invalid payload",
            { enabled: "yes" },
        );
    } finally {
        jest.useRealTimers();
    }
});

test("instant mode creates a PDF draft after a stable text selection and avoids duplicate dispatches", () => {
    jest.useFakeTimers();
    try {
        const page = createRenderedPage(1, {
            borderLeft: 10,
            borderTop: 5,
        });
        const harness = createHarness([page]);
        harness.controller.init();

        setSelection("instant quote", [[rect(150, 100, 250, 120)]]);
        dispatchSelectionChange();
        jest.advanceTimersByTime(300);
        expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();

        harness.thoriumBus.dispatch("annotations:set-instant-mode", {
            enabled: true,
        });
        dispatchSelectionChange();
        jest.advanceTimersByTime(300);

        expect(latestDraftDispatch(harness.thoriumBus)?.args[0]).toEqual({
            draft: {
                type: "pdf-text-highlight",
                page: 1,
                rects: [
                    {
                        x1: 20,
                        y1: 367.5,
                        x2: 70,
                        y2: 377.5,
                    },
                ],
                quote: "instant quote",
            },
            source: "instant-selection",
        });

        dispatchSelectionChange();
        jest.advanceTimersByTime(300);
        expect(
            harness.thoriumBus.dispatches.filter((dispatch) => dispatch.key === "annotation:create-requested"),
        ).toHaveLength(1);
    } finally {
        jest.useRealTimers();
    }
});

test("instant mode reports invalid settled selections with an instant-selection source", () => {
    jest.useFakeTimers();
    try {
        const first = createRenderedPage(1, { left: 100, top: 50 });
        const second = createRenderedPage(2, { left: 100, top: 900 });
        const harness = createHarness([first, second]);
        harness.controller.init();
        harness.thoriumBus.dispatch("annotations:set-instant-mode", {
            enabled: true,
        });
        setSelection("two pages", [[rect(150, 100, 250, 120), rect(150, 950, 250, 970)]]);

        dispatchSelectionChange();
        jest.advanceTimersByTime(300);

        expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
        expect(latestSelectionErrorDispatch(harness.thoriumBus)?.args[0]).toEqual({
            source: "instant-selection",
            reason: "multi-page",
        });
    } finally {
        jest.useRealTimers();
    }
});

test("hovering a rendered highlight shows a clickable cursor without enabling overlay pointer events", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    setHighlightClientRect("first", rect(110, 120, 150, 160));

    setSelection("active text selection", []);
    dispatchAnnotationPointerMove(130, 140, { target: page.pageElement });
    expect(document.documentElement.classList.contains(ANNOTATION_CLICKABLE_CURSOR_CLASS)).toBe(false);

    Object.defineProperty(window, "getSelection", {
        value: () => ({
            toString: () => "",
        }),
        configurable: true,
    });

    dispatchAnnotationPointerMove(130, 140, { target: page.pageElement });
    expect(document.documentElement.classList.contains(ANNOTATION_CLICKABLE_CURSOR_CLASS)).toBe(true);
    expect(highlights()[0].style.pointerEvents).toBe("none");

    dispatchAnnotationPointerMove(130, 140, {
        buttons: 1,
        target: page.pageElement,
    });
    expect(document.documentElement.classList.contains(ANNOTATION_CLICKABLE_CURSOR_CLASS)).toBe(false);

    dispatchAnnotationPointerMove(90, 90, { target: page.pageElement });
    expect(document.documentElement.classList.contains(ANNOTATION_CLICKABLE_CURSOR_CLASS)).toBe(false);
});

test("clicking inside a rendered highlight emits annotation:selected without enabling overlay pointer events", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1, [{ x1: 10, y1: 20, x2: 30, y2: 40 }])],
    });
    setHighlightClientRect("first", rect(110, 120, 150, 160));

    dispatchAnnotationClick(130, 140, {
        shiftKey: true,
        altKey: true,
        target: page.pageElement,
    });

    expect(highlights()[0].style.pointerEvents).toBe("none");
    expect(latestSelectedDispatch(harness.thoriumBus)?.args[0]).toEqual({
        id: "first",
        page: 1,
        rectIndex: 0,
        rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
        source: "overlay-click",
        shiftKey: true,
        altKey: true,
        ctrlKey: false,
        metaKey: false,
    });
});

test("annotation:selected hit testing ignores clicks outside highlights and prefers the smallest overlap", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [
            annotation("large", 1, [{ x1: 10, y1: 20, x2: 80, y2: 90 }]),
            annotation("small", 1, [{ x1: 30, y1: 40, x2: 50, y2: 60 }]),
        ],
    });
    setHighlightClientRect("large", rect(100, 100, 200, 200));
    setHighlightClientRect("small", rect(120, 120, 140, 140));

    dispatchAnnotationClick(90, 90, { target: page.pageElement });
    expect(latestSelectedDispatch(harness.thoriumBus)).toBeUndefined();

    dispatchAnnotationClick(130, 130);
    expect(latestSelectedDispatch(harness.thoriumBus)).toBeUndefined();

    dispatchAnnotationClick(130, 130, { target: page.pageElement });
    expect(latestSelectedDispatch(harness.thoriumBus)?.args[0]).toEqual(
        expect.objectContaining({
            id: "small",
            rectIndex: 0,
        }),
    );
});

test("annotation:selected ignores active text selection and drag-like pointer movement", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    setHighlightClientRect("first", rect(110, 120, 150, 160));

    setSelection("active text selection", []);
    dispatchAnnotationClick(130, 140, { target: page.pageElement });
    expect(latestSelectedDispatch(harness.thoriumBus)).toBeUndefined();

    Object.defineProperty(window, "getSelection", {
        value: () => ({
            toString: () => "",
        }),
        configurable: true,
    });
    dispatchAnnotationClick(130, 140, {
        pointerDownX: 100,
        pointerDownY: 100,
        target: page.pageElement,
    });
    expect(latestSelectedDispatch(harness.thoriumBus)).toBeUndefined();
});

test("annotation:selected keeps shift-click editing available when text selection remains active", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1)],
    });
    setHighlightClientRect("first", rect(110, 120, 150, 160));
    setSelection("leftover text selection", []);

    dispatchAnnotationClick(130, 140, {
        shiftKey: true,
        target: page.pageElement,
    });

    expect(latestSelectedDispatch(harness.thoriumBus)?.args[0]).toEqual(
        expect.objectContaining({
            id: "first",
            source: "overlay-click",
            shiftKey: true,
        }),
    );
});

test("overlay rendering applies transported PDF colors and draw types", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [
            annotation("solid", 1, [{ x1: 10, y1: 20, x2: 30, y2: 40 }], {
                color: { red: 10, green: 20, blue: 30 },
                drawType: "solid_background",
            }),
            annotation("underline", 1, [{ x1: 10, y1: 50, x2: 30, y2: 70 }], {
                color: { red: 40, green: 50, blue: 60 },
                drawType: "underline",
            }),
            annotation("strikethrough", 1, [{ x1: 10, y1: 80, x2: 30, y2: 100 }], {
                color: { red: 70, green: 80, blue: 90 },
                drawType: "strikethrough",
            }),
            annotation("outline", 1, [{ x1: 10, y1: 110, x2: 30, y2: 130 }], {
                color: { red: 100, green: 110, blue: 120 },
                drawType: "outline",
            }),
        ],
    });

    const byId = Object.fromEntries(
        highlights(page.pageElement).map((highlight) => [highlight.dataset.annotationId, highlight]),
    );

    expect(byId.solid.dataset.drawType).toBe("solid_background");
    expect(byId.solid.style.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(byId.solid.style.opacity).toBe("0.35");
    expect(byId.solid.style.mixBlendMode).toBe("multiply");

    expect(byId.underline.dataset.drawType).toBe("underline");
    expect(byId.underline.style.backgroundColor).toBe("transparent");
    expect(byId.underline.style.borderBottom).toBe("2px solid rgb(40, 50, 60)");

    expect(byId.strikethrough.dataset.drawType).toBe("strikethrough");
    expect(byId.strikethrough.style.backgroundColor).toBe("transparent");
    expect(byId.strikethrough.style.borderTop).toBe("2px solid rgb(70, 80, 90)");
    expect(byId.strikethrough.style.transform).toBe("translateY(50%)");

    expect(byId.outline.dataset.drawType).toBe("outline");
    expect(byId.outline.style.backgroundColor).toBe("transparent");
    expect(byId.outline.style.border).toBe("2px solid rgb(100, 110, 120)");
});

test("overlay rendering falls back for legacy snapshots without color or draw type", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [
            annotation("legacy", 1, [{ x1: 10, y1: 20, x2: 30, y2: 40 }], {
                color: undefined as unknown as TPdfAnnotationTransport["color"],
                drawType: undefined as unknown as TPdfAnnotationTransport["drawType"],
            }),
        ],
    });

    const [highlight] = highlights(page.pageElement);
    expect(highlight.dataset.drawType).toBe("solid_background");
    expect(highlight.style.backgroundColor).toBe("rgb(254, 243, 189)");
    expect(highlight.style.opacity).toBe("0.35");
});

test("annotations:sync updates edited overlay style and removes deleted annotations", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("edited", 1), annotation("deleted", 1, [{ x1: 40, y1: 50, x2: 60, y2: 70 }])],
    });
    expect(highlights(page.pageElement).map((highlight) => highlight.dataset.annotationId)).toEqual([
        "edited",
        "deleted",
    ]);

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [
            annotation("edited", 1, [{ x1: 10, y1: 20, x2: 30, y2: 40 }], {
                color: { red: 20, green: 120, blue: 220 },
                drawType: "outline",
            }),
        ],
    });

    const [highlight] = highlights(page.pageElement);
    expect(highlights(page.pageElement)).toHaveLength(1);
    expect(highlight.dataset.annotationId).toBe("edited");
    expect(highlight.dataset.drawType).toBe("outline");
    expect(highlight.style.border).toBe("2px solid rgb(20, 120, 220)");
});

test("viewer:go-to-annotation navigates by annotation id and flashes the rendered highlight", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1, [{ x1: 10, y1: 20, x2: 30, y2: 40 }])],
    });

    harness.thoriumBus.dispatch("viewer:go-to-annotation", {
        id: "first",
        page: 99,
        rect: { x1: 100, y1: 120, x2: 140, y2: 160 },
    });

    expect(harness.app.pdfViewer.scrollPageIntoView).toHaveBeenCalledWith({ pageNumber: 1 });
    const [highlight] = highlights(page.pageElement);
    expect(highlight.dataset.annotationId).toBe("first");
    expect(highlight.dataset.navigationFlash).toBe("true");
    expect(highlight.style.outline).toBe("2px solid rgba(37, 99, 235, 0.95)");
});

test("viewer:go-to-annotation aligns a viewport marker before scrolling", () => {
    const viewport = {
        width: 600,
        height: 800,
        convertToPdfPoint: (x: number, y: number) => [x, y],
        convertToViewportRectangle: jest.fn((_rect: number[]) => [120, 140, 220, 180]),
    };
    const page = createRenderedPage(1, {
        viewport,
    });
    const scrolledElements: HTMLElement[] = [];
    mockScrollIntoView(scrolledElements);
    const harness = createHarness([page]);
    harness.controller.init();
    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [annotation("first", 1, [{ x1: 10, y1: 20, x2: 30, y2: 40 }])],
    });

    harness.thoriumBus.dispatch("viewer:go-to-annotation", {
        id: "first",
        page: 1,
        rect: { x1: 100, y1: 120, x2: 140, y2: 160 },
    });

    expect(viewport.convertToViewportRectangle).toHaveBeenCalledWith([10, 20, 30, 40]);
    expect(scrolledElements).toHaveLength(1);
    expect(scrolledElements[0].style.left).toBe("120px");
    expect(scrolledElements[0].style.top).toBe("140px");
    expect(scrolledElements[0].style.width).toBe("100px");
    expect(scrolledElements[0].style.height).toBe("40px");
    expect(scrolledElements[0].parentElement).toBeNull();
});

test("viewer:go-to-annotation falls back to page scrolling when viewport alignment is unavailable", () => {
    const page = createRenderedPage(1, {
        viewport: {
            width: 600,
            height: 800,
            convertToPdfPoint: (x: number, y: number) => [x, y],
        },
    });
    const scrolledElements: HTMLElement[] = [];
    mockScrollIntoView(scrolledElements);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.thoriumBus.dispatch("viewer:go-to-annotation", {
        id: "missing",
        page: 1,
        rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
    });

    expect(scrolledElements).toEqual([page.pageElement]);
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "viewer:go-to-annotation skipped rect alignment: missing viewport conversion",
        {
            id: "missing",
            page: 1,
        },
    );
});

test("viewer:go-to-annotation falls back to payload page and rect when the id is absent from the snapshot", () => {
    const page = createRenderedPage(2);
    const harness = createHarness([page]);
    harness.controller.init();

    expect(() =>
        harness.thoriumBus.dispatch("viewer:go-to-annotation", {
            id: "missing",
            page: 2,
            rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
        }),
    ).not.toThrow();

    expect(harness.app.pdfViewer.scrollPageIntoView).toHaveBeenCalledWith({ pageNumber: 2 });
    expect(highlights(page.pageElement)).toHaveLength(0);
});

test("viewer:go-to-annotation rejects invalid navigation payloads before scrolling", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.thoriumBus.dispatch("viewer:go-to-annotation", {
        id: "bad-page",
        page: 0,
        rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
    });
    harness.thoriumBus.dispatch("viewer:go-to-annotation", {
        id: "bad-rect",
        page: 1,
        rect: { x1: 10, y1: 20, x2: Number.NaN, y2: 40 },
    });

    expect(harness.app.pdfViewer.scrollPageIntoView).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "viewer:go-to-annotation ignored invalid payload",
        expect.objectContaining({ id: "bad-page" }),
    );
    expect(console.error).toHaveBeenCalledWith(
        "[Thorium PDF annotations]",
        "viewer:go-to-annotation ignored invalid payload",
        expect.objectContaining({ id: "bad-rect" }),
    );
});
