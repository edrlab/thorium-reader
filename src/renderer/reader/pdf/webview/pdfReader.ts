// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { debounce } from "debounce";
import * as path from "path";
import * as pdfJs from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist/types/display/api";
import { PageViewport } from "pdfjs-dist/types/display/display_utils";
import {
    _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import {
    convertCustomSchemeToHttpUrl, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";

import {
    IEventBusPdfPlayer, ILink, IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView, TToc,
} from "../common/pdfReader.type";

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

type TUnPromise<T extends any> =
    T extends Promise<infer R> ? R : any;
type TReturnPromise<T extends (...args: any) => any> =
    T extends (...args: any) => Promise<infer R> ? R : any;
type TUnArray<T extends any> =
    T extends Array<infer R> ? R : any;
type TGetDocument = ReturnType<typeof pdfJs.getDocument>;
type TPdfDocumentProxy = TUnPromise<TGetDocument["promise"]>;
type TOutlineRaw = TReturnPromise<TPdfDocumentProxy["getOutline"]>;
type TOutlineUnArray = TUnArray<TOutlineRaw>;

interface TdestForPageIndex { num: number; gen: number; }
type TdestObj = { name?: string} | TdestForPageIndex | null;

interface IOutline extends Partial<TOutlineUnArray> {
    dest?: string | TdestObj[];
    items?: IOutline[];
}

function destForPageIndexParse(destRaw: any | any[]): TdestForPageIndex | undefined {

    const destArray = Array.isArray(destRaw) ? destRaw : [destRaw];

    const destForPageIndex = destArray.reduce<TdestForPageIndex | undefined>(
        (pv, cv: TdestForPageIndex) => (typeof cv?.gen === "number" && typeof cv?.num === "number") ? cv : pv,
        undefined,
    );

    return destForPageIndex;
}

async function tocOutlineItemToLink(outline: IOutline, pdf: PDFDocumentProxy): Promise<ILink> {

    const link: ILink = {};

    if (outline.dest) {

        const destRaw = outline.dest;
        let destForPageIndex: TdestForPageIndex | undefined;

        if (typeof destRaw === "string") {
            const destArray = await pdf.getDestination(destRaw);

            destForPageIndex = destForPageIndexParse(destArray);

        } else if (typeof destRaw === "object") {
            destForPageIndex = destForPageIndexParse(destRaw);
        }

        if (destForPageIndex) {
            // tslint:disable-next-line: max-line-length
            const page = (await pdf.getPageIndex(destForPageIndex) as unknown as number); // type error should be return a number zero based
            const pageOffset = page + 1;
            link.Href = pageOffset.toString();
        }

    }

    link.Title = typeof outline.title === "string" ? outline.title : "";

    if (Array.isArray(outline.items)) {

        const itemsPromise = outline.items.map(async (item) => tocOutlineItemToLink(item, pdf));
        link.Children = await Promise.all(itemsPromise);
    }

    return link;
}

export async function pdfReaderMountingPoint(
    rootElement: HTMLElement,
    pdfPath: string,
    bus: IEventBusPdfPlayer,
    defaultView: IPdfPlayerView = "paginated",
    defaultColumn: IPdfPlayerColumn = "1",
    defaultScale: IPdfPlayerScale = "fit",
): Promise<TToc> {

    const canvas = document.createElement("canvas");
    rootElement.appendChild(canvas);

    canvas.width = rootElement.clientWidth;
    canvas.height = rootElement.clientHeight;
    canvas.setAttribute("style", "display: block; position: absolute; left: 0; top: 0;");

    console.log("BEFORE pdfJs.getDocument", pdfPath);
    if (pdfPath.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL)) {
        pdfPath = convertCustomSchemeToHttpUrl(pdfPath);
    }
    console.log("BEFORE pdfJs.getDocument ADJUSTED", pdfPath);
    const pdf = await pdfJs.getDocument(pdfPath).promise;
    console.log("AFTER pdfJs.getDocument", pdfPath);

    const outline: IOutline[] = await pdf.getOutline();
    let toc: TToc = [];

    try {
        if (Array.isArray(outline)) {
            const tocPromise = outline.map((item) => tocOutlineItemToLink(item, pdf));
            toc = await Promise.all(tocPromise);
        }
    } catch (e) {

        console.error("Error to convert outline to toc link");
        console.error(e);

        toc = [];
    }

    console.log("outline", outline);
    console.log("toc", toc);

    // annotation div
    const annotationDiv = document.createElement("div");
    annotationDiv.setAttribute("id", "annotation-layer");

    // text div
    const textDiv = document.createElement("div");
    textDiv.setAttribute("id", "text-layer");

    let _lastPageNumber = -1;
    let _scale: IPdfPlayerScale = defaultScale;
    // tslint:disable-next-line:prefer-const
    let _view: IPdfPlayerView = defaultView;
    // tslint:disable-next-line:prefer-const
    let _column: IPdfPlayerColumn = defaultColumn;

    console.log(_view, _column); // not implemented

    const displayPageNumber = async (pageNumber: number) => {
        const pdfPage = await pdf.getPage(pageNumber);

        // PDF is 72dpi
        // CSS is 96dpi
        const SCALE = 1;
        const CSS_UNITS = 1; // 96 / 72;

        const viewportNoScale = pdfPage.getViewport({ scale: SCALE });

        const scaleW = rootElement.clientWidth / (viewportNoScale.width * CSS_UNITS);
        const scaleH = rootElement.clientHeight / (viewportNoScale.height * CSS_UNITS);

        let viewport: PageViewport;

        switch (_scale) {

            case "fit": {

                const scale = scaleW;
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = "0px";

                canvas.ownerDocument.body.style.overflow = "hidden";
                canvas.ownerDocument.body.style.overflowX = "hidden";
                canvas.ownerDocument.body.style.overflowY = "auto";
                break;
            }

            case "width": {

                const scale = Math.min(scaleW, scaleH);
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = `${(rootElement.clientWidth - (viewport.width * CSS_UNITS)) / 2}px`;

                canvas.ownerDocument.body.style.overflow = "hidden";
                canvas.ownerDocument.body.style.overflowX = "hidden";
                canvas.ownerDocument.body.style.overflowY = "hidden";
                break;

            }

            case "50": {

                const scale = SCALE * 2;
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = "0px";

                canvas.ownerDocument.body.style.overflow = "auto";
                canvas.ownerDocument.body.style.overflowX = "auto";
                canvas.ownerDocument.body.style.overflowY = "auto";
                break;
            }

            case "100": {

                const scale = SCALE * 4;
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = "0px";

                canvas.ownerDocument.body.style.overflow = "auto";
                canvas.ownerDocument.body.style.overflowX = "auto";
                canvas.ownerDocument.body.style.overflowY = "auto";
                break;

            }

            case "150": {

                const scale = SCALE * 6;
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = "0px";

                canvas.ownerDocument.body.style.overflow = "auto";
                canvas.ownerDocument.body.style.overflowX = "auto";
                canvas.ownerDocument.body.style.overflowY = "auto";
                break;

            }

            case "200": {

                const scale = SCALE * 8;
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = "0px";

                canvas.ownerDocument.body.style.overflow = "auto";
                canvas.ownerDocument.body.style.overflowX = "auto";
                canvas.ownerDocument.body.style.overflowY = "auto";
                break;

            }

            case "300": {

                const scale = SCALE * 12;
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = "0px";

                canvas.ownerDocument.body.style.overflow = "auto";
                canvas.ownerDocument.body.style.overflowX = "auto";
                canvas.ownerDocument.body.style.overflowY = "auto";
                break;

            }

            case "500": {

                const scale = SCALE * 16;
                viewport = pdfPage.getViewport({ scale });

                canvas.width = viewport.width * CSS_UNITS;
                canvas.height = viewport.height * CSS_UNITS;

                canvas.style.left = "0px";

                canvas.ownerDocument.body.style.overflow = "auto";
                canvas.ownerDocument.body.style.overflowX = "auto";
                canvas.ownerDocument.body.style.overflowY = "auto";
                break;

            }
        }

        const canvas2d = canvas.getContext("2d");

        await pdfPage.render({
            canvasContext: canvas2d,
            viewport,
        }).promise;

        const annotationData = await pdfPage.getAnnotations();

        const canvasOffsetLeft = canvas.offsetLeft;
        const canvasOffsetTop = canvas.offsetTop;
        const canvasHeight = canvas.height;
        const canvasWidth = canvas.width;

        // tslint:disable-next-line: max-line-length
        annotationDiv.setAttribute("style", `left: ${canvasOffsetLeft}px; top: ${canvasOffsetTop}px; height: ${canvasHeight}px; width: ${canvasWidth}px;`);
        rootElement.appendChild(annotationDiv);

        pdfJs.AnnotationLayer.render({
            viewport: viewport.clone({dontFlip: true}),
            div: annotationDiv,
            annotations: annotationData,
            page: pdfPage,
            linkService: {
                getDestinationHash: (destination: any) => {
                    console.log("getDestinationHash", destination);
                    return "";
                },
                navigateTo: async (destination: any) => {
                    console.log("navigateTo", destination);

                    const dest = destForPageIndexParse(destination);

                    // tslint:disable-next-line: max-line-length
                    const page = (await pdf.getPageIndex(dest) as unknown as number); // type error should be return a number zero based
                    const pageOffset = page + 1;
                    _lastPageNumber = pageNumberCheck(pageOffset);

                    await displayPageNumber(_lastPageNumber);

                    bus.dispatch("page", _lastPageNumber);

                    // return void;
                },
                getAnchorUrl: (url: string) => {
                    console.log("getAnchorUrl", url);
                    return "";
                },
                executeNamedAction: (action: any) => {
                    console.log("executeNamedAction", action);
                    // return void;
                },
            },
            downloadManager: undefined,
            renderInteractiveForms: true,
        });

        // tslint:disable-next-line: max-line-length
        textDiv.setAttribute("style", `left: ${canvasOffsetLeft}px; top: ${canvasOffsetTop}px; height: ${canvasHeight}px; width: ${canvasWidth}px;`);
        rootElement.appendChild(textDiv);

        const textContent = await pdfPage.getTextContent();

        await pdfJs.renderTextLayer({
            textContent,
            container: textDiv,
            viewport,
            textDivs: [],
        }).promise;

    };

    const debouncedResize = debounce(async () => {
        console.log("resize DEBOUNCED", rootElement.clientWidth, rootElement.clientHeight);
        if (_lastPageNumber >= 0) {
            await displayPageNumber(_lastPageNumber);
        }
    }, 500);

    window.addEventListener("resize", async () => {
        console.log("resize", rootElement.clientWidth, rootElement.clientHeight);
        await debouncedResize();
    });

    const pageNumberCheck = (pageNumber: number) => {
        return pageNumber < 1 ? 1 : pageNumber;
    };

    bus.subscribe("page", async (pageNumber: number) => {
        _lastPageNumber = pageNumberCheck(pageNumber);

        await displayPageNumber(_lastPageNumber);

        bus.dispatch("page", _lastPageNumber);
    });

    bus.subscribe("page-next", async () => {
        _lastPageNumber = pageNumberCheck(++_lastPageNumber);

        await displayPageNumber(_lastPageNumber);

        bus.dispatch("page", _lastPageNumber);
    });

    bus.subscribe("page-previous", async () => {
        _lastPageNumber = pageNumberCheck(--_lastPageNumber);

        await displayPageNumber(_lastPageNumber);

        bus.dispatch("page", _lastPageNumber);
    });

    bus.subscribe("scale", async (scale) => {
        _scale = scale;

        console.log("scale", scale);
        await displayPageNumber(_lastPageNumber);

        bus.dispatch("scale", scale);
    });

    bus.subscribe("view", async (view) => {
        _view = view;

        console.log("view", view);

        bus.dispatch("view", view);
    });

    bus.subscribe("column", (col) => {
        _column = col;

        console.log("col", col);

        bus.dispatch("column", col);
    });

    bus.subscribe("search", (search) => {

        console.log("search", search);
    });

    return toc;
}
