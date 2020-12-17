// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { debounce } from "debounce";
import * as path from "path";
import * as pdfViewerDist from "pdfjs-dist/web/pdf_viewer";
import {
    _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import { goToPageAction } from "./actions";
import { createAnnotationDiv } from "./annotation";
import { createCanvas } from "./canvas";
import { IEVState, IPdfBus, IPdfState, IPdfStore } from "./index_pdf";
import { EventBus } from "./pdfEventBus";
import { pdfJs } from "./pdfjs";
import { storeInit } from "./store";
import { getToc } from "./toc";
import { displayPageInCanvaFactory } from "./view/paginated/display";

// import * as pdfJs from "pdfjs-dist/webpack";

// webpack.config.renderer-reader.js
// pdfJs.GlobalWorkerOptions.workerSrc = "pdf.worker.js";
// pdfJs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js";
// pdfJs.GlobalWorkerOptions.workerPort = new Worker("https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js");
// const workerUrl = "https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js";

const dirname = (global as any).__dirname || (document.location.pathname + "/../");

let workerUrl = "index_pdf.worker.js";
if (_PACKAGING === "1") {
    workerUrl = "file://" + path.normalize(path.join(dirname, workerUrl));
} else {
    if (_RENDERER_PDF_WEBVIEW_BASE_URL === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        workerUrl = "file://" +
            path.normalize(path.join(dirname, _DIST_RELATIVE_URL, workerUrl));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        workerUrl = "file://" + path.normalize(path.join(process.cwd(), "dist", workerUrl));
    }
}
workerUrl = workerUrl.replace(/\\/g, "/");

pdfJs.GlobalWorkerOptions.workerPort = new Worker(window.URL.createObjectURL(
    new Blob([`importScripts('${workerUrl}');`], { type: "application/javascript" })));

// HTTP Content-Type is "text/plain" :(
// pdfJs.GlobalWorkerOptions.workerSrc =
// "https://raw.githubusercontent.com/mozilla/pdfjs-dist/v2.6.347/build/pdf.worker.min.js";

// import * as path from "path";
// let workerPath = "pdf.worker.js";
// // if (_PACKAGING === "1") {
// //     preloadPath = "file://" + path.normalize(path.join((global as any).__dirname, preloadPath));
// // } else {
// //     preloadPath = "index_pdf.js";

// //     if (_RENDERER_READER_BASE_URL === "file://") {
// //         // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
// //         preloadPath = "file://" +
// //             path.normalize(path.join((global as any).__dirname, _NODE_MODULE_RELATIVE_URL, preloadPath));
// //     } else {
// //         // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
// //         preloadPath = "file://" + path.normalize(path.join(process.cwd(), "node_modules", preloadPath));
// //     }
// // }
// workerPath = "file://" + path.normalize(path.join(process.cwd(), "dist", workerPath));
// workerPath = workerPath.replace(/\\/g, "/");
// pdfJs.GlobalWorkerOptions.workerSrc = workerPath;

export async function pdfReaderInit(
    pdfPath: string,
    bus: IPdfBus,
    _state: Partial<IPdfState>,
): Promise<IPdfStore> {

    const state: IPdfState = {
        ...{
            view: "scrolled", // set in index_pdf.ts
            column: "1", // set in index_pdf.ts
            scale: "page-fit", // set in index_pdf.ts
            lastPageNumber: 1,
            displayPage: () => Promise.resolve(),
            pdfViewer: null,
            pdfDistEventBus: null,
            pdfDocument: null,
        },
        ..._state,
    };

    if (!bus) {
        throw new Error("no BUS !!");
    }
    if (!pdfPath) {
        throw new Error("no pdfPath !!");
    }
    // parse pdf
    const pdfDocument = await pdfJs.getDocument(pdfPath).promise;

    const toc = await getToc(pdfDocument);
    bus.dispatch("toc", toc);
    console.log("toc", toc);

    const pdfStore = storeInit(state);

    const pdfDistEventBus = new EventBus();

    pdfDistEventBus.onAll((key: string) => (...a: any[]) => console.log("PDFEVENT", key, ...a));

    const debounceUpdateviewarea = debounce(async (evt: any) => {
        try {
            const { location: { pageNumber } } = evt;
            console.log("pageNumber", pageNumber);
            bus.dispatch("page", pageNumber);
        } catch (e) {
            console.log("updateviewarea ERROR", e);
        }
    });
    pdfDistEventBus.on("updateviewarea", async (evt: any) => {
        await debounceUpdateviewarea(evt);
    });

    const pdfLinkService = new pdfViewerDist.PDFLinkService({
        eventBus: pdfDistEventBus,
        // externalLinkTarget: AppOptions.get("externalLinkTarget"),
        // externalLinkRel: AppOptions.get("externalLinkRel"),
        // ignoreDestinationZoom: AppOptions.get("ignoreDestinationZoom"),
    });

    const findController = new pdfViewerDist.PDFFindController({
        linkService: pdfLinkService,
        eventBus: pdfDistEventBus,
    });

    // https://github.com/mozilla/pdf.js/blob/3c603fb28befaf9befbb4df9c612406f9225f23c/web/app.js#L2787
    // function webViewerUpdateFindControlState({
    //     state,
    //     previous,
    //     matchesCount,
    //     rawQuery,
    // }) {
    //     if (PDFViewerApplication.supportsIntegratedFind) {
    //         PDFViewerApplication.externalServices.updateFindControlState({
    //             result: state,
    //             findPrevious: previous,
    //             matchesCount,
    //             rawQuery,
    //         });
    //     } else {
    //         PDFViewerApplication.findBar.updateUIState(state, previous, matchesCount);
    //     }
    // }
    pdfDistEventBus.on("updatefindmatchescount", ({
        matchesCount,

    }: any) => {
        console.log("updatte find matches count", matchesCount);
    });

    pdfDistEventBus.on("updatefindcontrolstate", ({
        // tslint:disable-next-line: variable-name
        state: ___state,
        previous,
        matchesCount,
        rawQuery,

    }: any) => {
        console.log("updatte find control state", ___state, previous, matchesCount, rawQuery);
    });

    /*
    // https://github.com/mozilla/pdf.js/blob/959dc379ee6b5259e7ce804a25dc19d795c6cafc/web/pdf_find_bar.js#L66

    this.findPreviousButton.addEventListener("click", () => {
      this.dispatchEvent("again", true);
    });

    this.findNextButton.addEventListener("click", () => {
      this.dispatchEvent("again", false);
    });

    this.highlightAll.addEventListener("click", () => {
      this.dispatchEvent("highlightallchange");
    });

    this.caseSensitive.addEventListener("click", () => {
      this.dispatchEvent("casesensitivitychange");
    });

    this.entireWord.addEventListener("click", () => {
      this.dispatchEvent("entirewordchange");
    });

    this.eventBus._on("resize", this._adjustWidth.bind(this));
  }

  reset() {
    this.updateUIState();
  }

  dispatchEvent(type, findPrev) {
    this.eventBus.dispatch("find", {
      source: this,
      type,
      query: this.findField.value,
      phraseSearch: true,
      caseSensitive: this.caseSensitive.checked,
      entireWord: this.entireWord.checked,
      highlightAll: this.highlightAll.checked,
      findPrevious: findPrev,
    });
  }

  */

    /*

    // https://github.com/mozilla/pdf.js/blob/959dc379ee6b5259e7ce804a25dc19d795c6cafc/web/app.js#L2744
    function webViewerFind(evt) {
    PDFViewerApplication.findController.executeCommand("find" + evt.type, {
      query: evt.query,
      phraseSearch: evt.phraseSearch,
      caseSensitive: evt.caseSensitive,
      entireWord: evt.entireWord,
      highlightAll: evt.highlightAll,
      findPrevious: evt.findPrevious,
    });
  }
  */

    const scrolledContainer = document.getElementById("viewerContainer");
    const scrolledViewer = document.getElementById("viewer");
    const pdfViewer = new pdfViewerDist.PDFViewer({
        container: scrolledContainer,
        viewer: scrolledViewer,
        eventBus: pdfDistEventBus,
        //   renderingQueue: pdfRenderingQueue,
        linkService: pdfLinkService,
        //   downloadManager,
        findController,
        //   renderer: AppOptions.get("renderer"),
        //   enableWebGL: AppOptions.get("enableWebGL"),
        //   l10n: this.l10n,
        //   textLayerMode: AppOptions.get("textLayerMode"),
        //   imageResourcesPath: AppOptions.get("imageResourcesPath"),
        //   renderInteractiveForms: AppOptions.get("renderInteractiveForms"),
        //   enablePrintAutoRotate: AppOptions.get("enablePrintAutoRotate"),
        //   useOnlyCssZoom: AppOptions.get("useOnlyCssZoom"),
        //   maxCanvasPixels: AppOptions.get("maxCanvasPixels"),
        //   enableScripting: AppOptions.get("enableScripting"),
    });

    pdfViewer.setDocument(pdfDocument);

    pdfStore.setState({ pdfViewer, pdfDistEventBus });

    // canva
    const paginatedContainer = document.getElementById("paginatedContainer");
    const canvas = createCanvas(paginatedContainer);

    // annotation div
    const annotationDiv = createAnnotationDiv(paginatedContainer);

    const displayPaginatedPage = displayPageInCanvaFactory(
        canvas,
        annotationDiv,
        pdfDocument,
        pdfStore,
        bus,
    );

    const displayScrolledPage = async (pageNumber: number) => {
        console.log("scrolled page number", pageNumber);

        setTimeout(() => {

            pdfViewer.currentPageNumber = pageNumber;
        }, 0);
    };

    const updateDisplayPage = ({ store }: IEVState) => {

        document.body.style.overflow = "auto";
        document.body.style.overflowY = "auto";
        document.body.style.overflowX = "auto";

        if (store.getState().view === "paginated") {
            scrolledContainer.hidden = true;
            paginatedContainer.hidden = false;
            store.setState({ displayPage: displayPaginatedPage });
        } else {
            paginatedContainer.hidden = true;
            scrolledContainer.hidden = false;
            store.setState({ displayPage: displayScrolledPage });
            pdfViewer.update();
            const { lastPageNumber } = store.getState();
            // tslint:disable-next-line: no-floating-promises
            displayScrolledPage(lastPageNumber);
        }
    };
    updateDisplayPage({ store: pdfStore, bus });

    bus.subscribe("page", goToPageAction);
    bus.subscribe("page-next",
        (a) => () => goToPageAction(a)(++a.store.getState().lastPageNumber));
    bus.subscribe("page-previous",
        (a) => () => goToPageAction(a)(--a.store.getState().lastPageNumber));
    bus.subscribe("scale",
        (a) => async (scale) => {
            a.store.setState({ scale });
            a.bus.dispatch("scale", scale);

            if (typeof scale === "number") {

                pdfViewer.currentScaleValue = scale / 100; // 10% become 0.1
            } else {

                pdfViewer.currentScaleValue = scale;
            }

            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("view",
        (a) => async (view) => {
            a.store.setState({ view });
            updateDisplayPage(a);
            a.bus.dispatch("view", view);
            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("column",
        (a) => async (column) => {
            a.store.setState({ column });
            a.bus.dispatch("column", column);

            pdfViewer.spreadMode = parseInt(column, 10);

            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });

    let searchRequest = "";
    bus.subscribe("search", () => (searchWord) => {

        console.log("SEARCH PDF", searchWord);

        searchRequest = searchWord;

        findController.executeCommand("find", {
            query: searchRequest,
            phraseSearch: true,
            caseSensitive: false,
            entireWord: false,
            highlightAll: true,
            findPrevious: undefined,
          });
    });

    bus.subscribe("search-next", () => () => {

        findController.executeCommand("findagain", {
            query: searchRequest,
            phraseSearch: true,
            caseSensitive: false,
            entireWord: false,
            highlightAll: true,
            findPrevious: false,
          });
    });

    bus.subscribe("search-previous", () => () => {
        findController.executeCommand("findagain", {
            query: searchRequest,
            phraseSearch: true,
            caseSensitive: false,
            entireWord: false,
            highlightAll: true,
            findPrevious: true,
          });
    });

    bus.subscribe("search-wipe", () => () => {
        pdfDistEventBus.dispatch("findbarclose");
    });

    const debouncedResize = debounce(async () => {
        console.log("resize DEBOUNCED", document.body.clientWidth, document.body.clientHeight);
        const { lastPageNumber, displayPage } = pdfStore.getState();
        if (lastPageNumber > 0) {
            await displayPage(lastPageNumber);
        }
    }, 500);

    window.addEventListener("resize", async () => {
        console.log("resize", document.body.clientWidth, document.body.clientHeight);
        await debouncedResize();
    });

    const DEFAULT_SCALE_DELTA = 1.1;
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 10.0;

    // https://github.com/mozilla/pdf.js/blob/00b4f86db301546d21d5dc79c61e2a9a829667a4/web/app.js#L609
    function zoomIn(ticks: number) {

        let newScale = pdfViewer.currentScale;
        do {
            newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(MAX_SCALE, newScale);
        } while (--ticks > 0 && newScale < MAX_SCALE);
        pdfViewer.currentScaleValue = newScale;
    }

    function zoomOut(ticks: number) {
        let newScale = pdfViewer.currentScale;
        do {
            newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(MIN_SCALE, newScale);
        } while (--ticks > 0 && newScale > MIN_SCALE);
        pdfViewer.currentScaleValue = newScale;
    }

    // function zoomReset() {
    //     pdfViewer.currentScaleValue = "page-fit";
    // }

    // https://github.com/mozilla/pdf.js/blob/00b4f86db301546d21d5dc79c61e2a9a829667a4/web/app.js#L2167
    let _wheelUnusedTicks = 0;
    function accumulateWheelTicks(ticks: number) {
        // If the scroll direction changed, reset the accumulated wheel ticks.
        if (
            (_wheelUnusedTicks > 0 && ticks < 0) ||
            (_wheelUnusedTicks < 0 && ticks > 0)
        ) {
            _wheelUnusedTicks = 0;
        }
        _wheelUnusedTicks += ticks;
        const wholeTicks =
            Math.sign(_wheelUnusedTicks) *
            Math.floor(Math.abs(_wheelUnusedTicks));
        _wheelUnusedTicks -= wholeTicks;
        return wholeTicks;
    }

    const WHEEL_ZOOM_DISABLED_TIMEOUT = 1000; // ms
    let zoomDisabledTimeout: any = null;
    function setZoomDisabledTimeout() {
        if (zoomDisabledTimeout) {
            clearTimeout(zoomDisabledTimeout);
        }
        zoomDisabledTimeout = setTimeout(() => {
            zoomDisabledTimeout = null;
        }, WHEEL_ZOOM_DISABLED_TIMEOUT);
    }

    // not avaialable from pdf_viewer , why ? // ln869
    // pdfViewerDist.normalizeWheelEventDirection(evt)
    function normalizeWheelEventDirection(evt: any) {
        let delta = Math.sqrt(evt.deltaX * evt.deltaX + evt.deltaY * evt.deltaY);
        const angle = Math.atan2(evt.deltaY, evt.deltaX);

        if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
            delta = -delta;
        }

        return delta;
    }

    // https://github.com/mozilla/pdf.js/blob/00b4f86db301546d21d5dc79c61e2a9a829667a4/web/app.js#L2832
    function webViewerWheel(evt: any) {
        if (
            evt.ctrlKey || evt.metaKey
        ) {
            // Only zoom the pages, not the entire viewer.
            evt.preventDefault();
            // NOTE: this check must be placed *after* preventDefault.
            if (zoomDisabledTimeout || document.visibilityState === "hidden") {
                return;
            }

            const previousScale = pdfViewer.currentScale;

            const delta = normalizeWheelEventDirection(evt);
            let ticks = 0;
            if (
                evt.deltaMode === WheelEvent.DOM_DELTA_LINE ||
                evt.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ) {
                // For line-based devices, use one tick per event, because different
                // OSs have different defaults for the number lines. But we generally
                // want one "clicky" roll of the wheel (which produces one event) to
                // adjust the zoom by one step.
                if (Math.abs(delta) >= 1) {
                    ticks = Math.sign(delta);
                } else {
                    // If we're getting fractional lines (I can't think of a scenario
                    // this might actually happen), be safe and use the accumulator.
                    ticks = accumulateWheelTicks(delta);
                }
            } else {
                // pixel-based devices
                const PIXELS_PER_LINE_SCALE = 30;
                ticks = accumulateWheelTicks(
                    delta / PIXELS_PER_LINE_SCALE,
                );
            }

            if (ticks < 0) {
                zoomOut(-ticks);
            } else if (ticks > 0) {
                zoomIn(ticks);
            }

            const currentScale = pdfViewer.currentScale;
            if (previousScale !== currentScale) {
                // After scaling the page via zoomIn/zoomOut, the position of the upper-
                // left corner is restored. When the mouse wheel is used, the position
                // under the cursor should be restored instead.
                const scaleCorrectionFactor = currentScale / previousScale - 1;
                const rect = pdfViewer.container.getBoundingClientRect();
                const dx = evt.clientX - rect.left;
                const dy = evt.clientY - rect.top;
                pdfViewer.container.scrollLeft += dx * scaleCorrectionFactor;
                pdfViewer.container.scrollTop += dy * scaleCorrectionFactor;
            }
        } else {
            setZoomDisabledTimeout();
        }
    }
    window.addEventListener("wheel", webViewerWheel, { passive: false });

    return pdfStore;
}
