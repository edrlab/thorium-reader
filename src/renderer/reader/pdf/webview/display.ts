// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/display/api";
import { PageViewport } from "pdfjs-dist/types/display/display_utils";

import { IPdfPlayerScale } from "../common/pdfReader.type";
import { pageNumberCheck } from "./actions";
import { IPdfBus, IPdfStore } from "./index_pdf";
import { pdfJs } from "./pdfjs";
import { destForPageIndexParse } from "./toc";

// PDF is 72dpi
// CSS is 96dpi
const SCALE = 1;
const CSS_UNITS = 1; // 96 / 72;

export interface IWindowViewPort { width: number; height: number; }

const getViewport =
    async (
        pdfPage: PDFPageProxy,
        windowViewportSize: IWindowViewPort,
        scale: IPdfPlayerScale,
    ) => {

        const viewportNoScale = pdfPage.getViewport({ scale: SCALE });

        const scaleW = windowViewportSize.width / (viewportNoScale.width * CSS_UNITS);
        const scaleH = windowViewportSize.height / (viewportNoScale.height * CSS_UNITS);

        const scaleDefined =
            scale === "fit"
                ? Math.min(scaleW, scaleH)
                : scale === "width"
                    ? scaleW
                    : typeof scale === "number"
                        ? scale / 25
                        : 2;

        return pdfPage.getViewport({ scale: scaleDefined });
    };

const setCanvasDimmension = (
    canvas: HTMLCanvasElement,
    viewport: PageViewport,
    windowViewportSize: IWindowViewPort,
    scale: IPdfPlayerScale,
) => {
    const canvasStyleLeft = scale === "fit"
        ? `${(windowViewportSize.width - (viewport.width * CSS_UNITS)) / 2}px`
        : "0px";
    canvas.style.left = canvasStyleLeft;

    canvas.width = viewport.width * CSS_UNITS;
    canvas.height = viewport.height * CSS_UNITS;

    const overflow = scale === "fit" || scale === "width" ? "hidden" : "auto";
    canvas.ownerDocument.body.style.overflow = overflow;
    canvas.ownerDocument.body.style.overflowX = overflow;
    canvas.ownerDocument.body.style.overflowY = scale === "fit" ? "hidden" : "auto";
};

const fitAnnotationDivWithCanvasSize = (
    canvas: HTMLCanvasElement,
    annotationDiv: HTMLDivElement,
) => {

    const canvasOffsetLeft = canvas.offsetLeft;
    const canvasOffsetTop = canvas.offsetTop;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;

    // tslint:disable-next-line: max-line-length
    annotationDiv.setAttribute("style", `left: ${canvasOffsetLeft}px; top: ${canvasOffsetTop}px; height: ${canvasHeight}px; width: ${canvasWidth}px;`);
    annotationDiv.innerHTML = "";
};

export const displayPageInCanvaFactory =
    (
        canvas: HTMLCanvasElement,
        annotationDiv: HTMLDivElement,
        pdf: PDFDocumentProxy,
        store: IPdfStore,
        windowViewportSize: IWindowViewPort,
        bus: IPdfBus,
    ) =>
        async (pageNumber: number) => {

            if (!windowViewportSize?.height || !windowViewportSize.height) {
                throw new Error("no client windowViewportSize");
            }

            // CANVAS rendering
            const { scale: _scale } = store.getState();

            const pdfPage = await pdf.getPage(pageNumber);

            const viewport = await getViewport(pdfPage, windowViewportSize, _scale);
            setCanvasDimmension(canvas, viewport, windowViewportSize, _scale);

            const canvas2d = canvas.getContext("2d");
            await pdfPage.render({
                canvasContext: canvas2d,
                viewport,
            }).promise;

            // DIV
            fitAnnotationDivWithCanvasSize(canvas, annotationDiv);

            // rendered in first for the span z index
            const textContent = await pdfPage.getTextContent();
            await pdfJs.renderTextLayer({
                textContent,
                container: annotationDiv,
                viewport,
                textDivs: [],
            }).promise;

            const annotationData = await pdfPage.getAnnotations();
            pdfJs.AnnotationLayer.render({
                viewport: viewport.clone({ dontFlip: true }),
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
                        const page = (await pdf.getPageIndex(dest) as unknown as number); // type error should return a number zero based
                        const pageOffset = page + 1;
                        store.setState({ lastPageNumber: pageNumberCheck(pageOffset) });

                        const { lastPageNumber, displayPage } = store.getState();
                        await displayPage(lastPageNumber);

                        bus.dispatch("page", lastPageNumber);

                        // return void;
                    },
                    getAnchorUrl: (url: string) => {
                        console.log("getAnchorUrl", url);
                        return "";
                    },
                    executeNamedAction: async (action: any) => {
                        console.log("executeNamedAction", action);
                        // return void;

                        switch (action) {
                            // case "GoBack":
                            //     await pagePreviousAction();
                            //     break;

                            // case "GoForward":
                            //     await pageNextAction();
                            //     break;

                            // case "NextPage":
                            //     await pageNextAction();
                            //     break;

                            // case "PrevPage":
                            //     await pagePreviousAction();
                            //     break;

                            // case "LastPage":
                            //     await goToPageAction(pdf.numPages);
                            //     break;

                            // case "FirstPage":
                            //     await goToPageAction(1);
                            //     break;

                            default:
                                break; // No action according to spec
                        }
                    },
                },
                downloadManager: undefined,
                renderInteractiveForms: true,
            });

        };
