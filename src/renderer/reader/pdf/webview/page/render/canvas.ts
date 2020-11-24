import { PDFPageProxy } from "pdfjs-dist/types/display/api";
import { PageViewport } from "pdfjs-dist/types/display/display_utils";
import { IEVState } from "../../index_pdf";

// const getViewport =
//     async (
//         pdfPage: PDFPageProxy,
//         windowViewportSize: IWindowViewPort,
//         scale: IPdfPlayerScale,
//     ) => {

//         const viewportNoScale = pdfPage.getViewport({ scale: SCALE });

//         const scaleW = windowViewportSize.width / (viewportNoScale.width * CSS_UNITS);
//         const scaleH = windowViewportSize.height / (viewportNoScale.height * CSS_UNITS);

//         const scaleDefined =
//             scale === "fit"
//                 ? Math.min(scaleW, scaleH)
//                 : scale === "width"
//                     ? scaleW
//                     : typeof scale === "number"
//                         ? scale / 50
//                         : 2;

//         return pdfPage.getViewport({ scale: scaleDefined });
//     };

// const setCanvasDimension = (
//     canvas: HTMLCanvasElement,
//     viewport: PageViewport,
//     windowViewportSize: IWindowViewPort,
//     scale: IPdfPlayerScale,
// ) => {
//     const canvasStyleLeft = scale === "fit"
//         ? `${(windowViewportSize.width - (viewport.width * CSS_UNITS)) / 2}px`
//         : "0px";
//     canvas.style.left = canvasStyleLeft;

//     canvas.width = viewport.width * CSS_UNITS;
//     canvas.height = viewport.height * CSS_UNITS;

//     const overflow = scale === "fit" || scale === "width" ? "hidden" : "auto";
//     canvas.ownerDocument.body.style.overflow = overflow;
//     canvas.ownerDocument.body.style.overflowX = overflow;
//     canvas.ownerDocument.body.style.overflowY = scale === "fit" ? "hidden" : "auto";
// };

export const renderCanvas = (_di: IEVState) =>
    async (
        pdfPage: PDFPageProxy,
        canvas: HTMLCanvasElement,
        viewport: PageViewport,
    ) => {

        if (!canvas) {
            throw new Error("no CANVAS");
        }

        // const { scale: _scale } = store.getState();

        // const viewport = await getViewport(pdfPage, windowViewportSize, _scale);
        // setCanvasDimension(canvas, viewport, windowViewportSize, _scale);

        const canvas2d = canvas.getContext("2d");
        await pdfPage.render({
            canvasContext: canvas2d,
            viewport,
        }).promise;
    };
