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

import { goToPageAction, searchAction } from "./actions";
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
            view: "paginated",
            column: "1",
            scale: "fit",
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

    const scrolledContainer = document.getElementById("viewerContainer");
    const scrolledViewer = document.getElementById("viewer");
    const pdfViewer = new pdfViewerDist.PDFViewer({
      container: scrolledContainer,
      viewer: scrolledViewer,
      eventBus: pdfDistEventBus,
    //   renderingQueue: pdfRenderingQueue,
    //   linkService: pdfLinkService,
    //   downloadManager,
    //   findController,
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

    pdfStore.setState({pdfViewer, pdfDistEventBus});

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

        pdfViewer.currentPageNumber = pageNumber;
    };

    const updateDisplayPage = ({store}: IEVState) => {

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
    updateDisplayPage({store: pdfStore, bus});

    bus.subscribe("page", goToPageAction);
    bus.subscribe("page-next",
        (a) => () => goToPageAction(a)(++a.store.getState().lastPageNumber));
    bus.subscribe("page-previous",
        (a) => () => goToPageAction(a)(--a.store.getState().lastPageNumber));
    bus.subscribe("scale",
        (a) => async (scale) => {
            a.store.setState({scale});
            a.bus.dispatch("scale", scale);
            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("view",
        (a) => async (view) => {
            a.store.setState({view});
            updateDisplayPage(a);
            a.bus.dispatch("view", view);
            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("column",
        (a) => async (column) => {
            a.store.setState({column});
            a.bus.dispatch("column", column);
            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("search", () => searchAction);

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

    return pdfStore;
}
