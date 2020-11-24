import { PDFPageProxy } from "pdfjs-dist/types/display/api";
import { PageViewport } from "pdfjs-dist/types/display/display_utils";

import { goToPageAction, pageNumberCheck } from "../../actions";
import { IEVState } from "../../index_pdf";
import { pdfJs } from "../../pdfjs";
import { destForPageIndexParse } from "../../toc";

const fitAnnotationDivWithSize = (
    size: { offsetLeft: number, offsetTop: number, height: number, width: number },
    annotationDiv: HTMLDivElement,
) => {
    const {
        offsetLeft,
        offsetTop,
        width,
        height,
    } = size;

    // tslint:disable-next-line: max-line-length
    annotationDiv.setAttribute("style", `left: ${offsetLeft}px; top: ${offsetTop}px; height: ${height}px; width: ${width}px;`);
    annotationDiv.innerHTML = "";
};

export const renderAnnotationData = (
    {
        pdf, store, bus,
    }: IEVState,
) => async (
    pdfPage: PDFPageProxy,
    el: { annotationDiv: HTMLDivElement, canvas: HTMLCanvasElement },
    viewport: PageViewport,
    ) => {

        const { annotationDiv, canvas } = el;

        if (!annotationDiv || !canvas) {
            throw new Error("no html EL");
        }

        const nbPages = pdf.numPages;
        console.log("Number of pages in the PDF ??", nbPages);

        // DIV
        fitAnnotationDivWithSize(canvas, annotationDiv);

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

                    const { lastPageNumber } = store.getState();
                    switch (action) {
                        case "GoBack":

                            await goToPageAction({ store, bus })(lastPageNumber - 1);
                            break;

                        case "GoForward":

                            await goToPageAction({ store, bus })(lastPageNumber + 1);
                            break;

                        case "NextPage":
                            await goToPageAction({ store, bus })(lastPageNumber + 1);
                            break;

                        case "PrevPage":
                            await goToPageAction({ store, bus })(lastPageNumber - 1);
                            break;

                        case "LastPage":
                            await goToPageAction({ store, bus })(nbPages || lastPageNumber);
                            break;

                        case "FirstPage":
                            await goToPageAction({ store, bus })(1);
                            break;

                        default:
                            break; // No action according to spec
                    }
                },
            },
            downloadManager: undefined,
            renderInteractiveForms: true,
        });

    };
