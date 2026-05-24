import { expect, jest, test, beforeEach, afterEach } from "@jest/globals";
import { JSDOM } from "jsdom";

import type { IEventBusPdfPlayer, TPdfAnnotationTransport } from "readium-desktop/renderer/reader/pdf/common/pdfReader.type";
import { PdfAnnotationController } from "readium-desktop/renderer/reader/pdf/webview/annotations";

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
            this.handlers.set(key, (this.handlers.get(key) || []).filter((handler) => handler !== fn));
            return;
        }

        for (const [handlerKey, handlers] of this.handlers) {
            this.handlers.set(handlerKey, handlers.filter((handler) => handler !== fn));
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
        this.handlers.set(key, (this.handlers.get(key) || []).filter((handler) => handler !== fn));
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

function createHarness(renderedPages: IRenderedPage[] = []) {
    const thoriumBus = new FakeThoriumBus();
    const pdfJsEventBus = new FakePdfJsEventBus();
    const pageViews = renderedPages.map((page) => page.pageView);
    const app = {
        eventBus: pdfJsEventBus,
        pdfViewer: {
            pagesCount: pageViews.length,
            getPageView: (index: number) => pageViews[index],
        },
    };
    const controller = new PdfAnnotationController(
        thoriumBus as unknown as IEventBusPdfPlayer,
        () => app as any,
    );

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
    rects = [
        { x1: 10, y1: 20, x2: 30, y2: 40 },
    ],
): TPdfAnnotationTransport {
    return {
        id,
        type: "pdf-text-highlight",
        page,
        rects,
        quote: `quote-${id}`,
    };
}

function overlayLayers(pageElement?: HTMLElement) {
    return Array.from((pageElement || document.body).querySelectorAll<HTMLElement>(".thorium-pdf-annotation-layer"));
}

function highlights(pageElement?: HTMLElement) {
    return Array.from((pageElement || document.body).querySelectorAll<HTMLElement>(".thorium-pdf-annotation-highlight"));
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
    return thoriumBus.dispatches
        .filter((dispatch) => dispatch.key === "annotation:create-requested")
        .at(-1);
}

function runNextAnimationFrame() {
    const callback = rafCallbacks.shift();
    if (callback) {
        callback(0);
    }
}

test("init subscribes to Thorium and PDF.js events only once", () => {
    const harness = createHarness();

    harness.controller.init();
    harness.controller.init();

    expect(harness.thoriumBus.listenerCount("annotations:sync")).toBe(1);
    expect(harness.thoriumBus.listenerCount("highlight:create-from-selection")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("pagesinit")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("documentloaded")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("pagerendered")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("scalechanging")).toBe(1);
    expect(harness.pdfJsEventBus.listenerCount("rotationchanging")).toBe(1);
});

test("annotations:sync replaces the snapshot, ignores missing ids, and empty sync clears overlays", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [
            annotation("first", 1),
        ],
    });
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["first"]);

    harness.thoriumBus.dispatch("annotations:sync", {
        annotations: [
            { ...annotation("missing", 1), id: "" },
            annotation("second", 1),
        ],
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
        annotations: [
            annotation("first", 1),
        ],
    });
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["first"]);

    expect(() => harness.thoriumBus.dispatch("annotations:sync", undefined)).not.toThrow();
    expect(highlights().map((highlight) => highlight.dataset.annotationId)).toEqual(["first"]);

    expect(() => harness.thoriumBus.dispatch("annotations:sync", {
        annotations: "not-an-array",
    })).not.toThrow();
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
    setSelection("   ", [
        [rect(150, 100, 250, 120)],
    ]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
});

test("highlight:create-from-selection rejects selections whose rects are too small", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("tiny", [
        [rect(150, 100, 150.5, 120)],
    ]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
});

test("highlight:create-from-selection rejects a selection that does not intersect a PDF page", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("outside", [
        [rect(900, 900, 950, 930)],
    ]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
});

test("highlight:create-from-selection rejects multi-page selections", () => {
    const first = createRenderedPage(1, { left: 100, top: 50 });
    const second = createRenderedPage(2, { left: 100, top: 900 });
    const harness = createHarness([first, second]);
    harness.controller.init();
    setSelection("two pages", [
        [
            rect(150, 100, 250, 120),
            rect(150, 950, 250, 970),
        ],
    ]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
});

test("highlight:create-from-selection rejects when the page element disappears before conversion", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([page]);
    const originalQuerySelector = document.querySelector.bind(document);
    jest.spyOn(document, "querySelector").mockImplementation((selector: string) => {
        if (selector === ".page[data-page-number=\"1\"]") {
            return null;
        }
        return originalQuerySelector(selector);
    });
    harness.controller.init();
    setSelection("missing page element", [
        [rect(150, 100, 250, 120)],
    ]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
});

test("highlight:create-from-selection rejects when the PDF.js viewport is missing", () => {
    const page = createRenderedPage(1);
    const harness = createHarness([{
        pageElement: page.pageElement,
        pageView: {},
    }]);
    harness.controller.init();
    setSelection("missing viewport", [
        [rect(150, 100, 250, 120)],
    ]);

    harness.thoriumBus.dispatch("highlight:create-from-selection");

    expect(latestDraftDispatch(harness.thoriumBus)).toBeUndefined();
});

test("highlight:create-from-selection dispatches a one-page PDF draft for a valid selection", () => {
    const page = createRenderedPage(1, {
        borderLeft: 10,
        borderTop: 5,
    });
    const harness = createHarness([page]);
    harness.controller.init();
    setSelection("selected quote", [
        [rect(150, 100, 250, 120)],
    ]);

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
        annotations: [
            annotation("first", 1),
            annotation("second", 2),
        ],
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
        annotations: [
            annotation("first", 1),
        ],
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
        annotations: [
            annotation("first", 1),
        ],
    });
    harness.pdfJsEventBus.emit("rotationchanging");

    harness.controller.destroy();
    runNextAnimationFrame();
    runNextAnimationFrame();

    expect(harness.thoriumBus.listenerCount("annotations:sync")).toBe(0);
    expect(harness.thoriumBus.listenerCount("highlight:create-from-selection")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("pagesinit")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("documentloaded")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("pagerendered")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("scalechanging")).toBe(0);
    expect(harness.pdfJsEventBus.listenerCount("rotationchanging")).toBe(0);
    expect(overlayLayers()).toHaveLength(0);

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
            annotation("second", 2, [
                { x1: 100, y1: 120, x2: 150, y2: 160 },
            ]),
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
