// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { debounce } from "debounce";
import * as path from "path";
import {
    _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import { goToPageAction, searchAction } from "./actions";
import { createAnnotationDiv } from "./annotation";
import { createCanvas } from "./canvas";
import { displayPageInCanvaFactory } from "./display";
import { IPdfBus, IPdfState, IPdfStore } from "./index_pdf";
import { pdfJs } from "./pdfjs";
import { storeInit } from "./store";
import { getToc } from "./toc";

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
    rootElement: HTMLElement,
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
        },
        ..._state,
    };

    if (!bus) {
        throw new Error("no BUS !!");
    }
    if (!pdfPath) {
        throw new Error("no pdfPath !!");
    }
    {
        const is = rootElement instanceof HTMLElement;
        if (!is) {
            throw new Error("no html el !!");
        }
    }

    // parse pdf
    const pdf = await pdfJs.getDocument(pdfPath).promise;

    const toc = await getToc(pdf);
    bus.dispatch("toc", toc);
    console.log("toc", toc);

    const pdfStore = storeInit(state);

    // canva
    const canvas = createCanvas(rootElement);

    // annotation div
    const annotationDiv = createAnnotationDiv(rootElement);

    const displayPage = displayPageInCanvaFactory(
        canvas,
        annotationDiv,
        pdf,
        pdfStore,
        {
            width: rootElement.clientWidth,
            height: rootElement.clientHeight,
        },
        bus,
    );

    pdfStore.setState({ displayPage });

    bus.subscribe("page", goToPageAction);
    bus.subscribe("page-next",
        (a) => () => goToPageAction(a)(++a.store.getState().lastPageNumber));
    bus.subscribe("page-previous",
        (a) => () => goToPageAction(a)(--a.store.getState().lastPageNumber));
    bus.subscribe("scale",
        (a) => async (scale) => {
            a.store.setState({scale});
            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("view",
        (a) => async (view) => {
            a.store.setState({view});
            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("column",
        (a) => async (column) => {
            a.store.setState({column});
            return goToPageAction(a)(a.store.getState().lastPageNumber);
        });
    bus.subscribe("search", () => searchAction);

    const debouncedResize = debounce(async () => {
        console.log("resize DEBOUNCED", rootElement.clientWidth, rootElement.clientHeight);
        const { lastPageNumber } = pdfStore.getState();
        if (lastPageNumber > 0) {
            await displayPage(lastPageNumber);
        }
    }, 500);

    window.addEventListener("resize", async () => {
        console.log("resize", rootElement.clientWidth, rootElement.clientHeight);
        await debouncedResize();
    });

    return pdfStore;
}
