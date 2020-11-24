// // ==LICENSE-BEGIN==
// // Copyright 2017 European Digital Reading Lab. All rights reserved.
// // Licensed to the Readium Foundation under one or more contributor license agreements.
// // Use of this source code is governed by a BSD-style license
// // that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// // ==LICENSE-END

// import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/display/api";
// import { PageViewport } from "pdfjs-dist/types/display/display_utils";

// import { IPdfPlayerScale } from "../common/pdfReader.type";
// import { goToPageAction, pageNumberCheck } from "./actions";
// import { IPdfBus, IPdfStore } from "./index_pdf";
// import { pdfJs } from "./pdfjs";
// import { destForPageIndexParse } from "./toc";

// // PDF is 72dpi
// // CSS is 96dpi
// const SCALE = 1;
// const CSS_UNITS = 1; // 96 / 72;

// export interface IWindowViewPort { width: number; height: number; }
// export const displayPageInCanvasFactory =
//     (
//         canvas: HTMLCanvasElement,
//         annotationDiv: HTMLDivElement,
//         pdf: PDFDocumentProxy,
//         store: IPdfStore,
//         windowViewportSize: IWindowViewPort,
//         bus: IPdfBus,
//     ) =>
//         async (pageNumber: number) => {

//             if (!windowViewportSize?.height || !windowViewportSize.height) {
//                 throw new Error("no client windowViewportSize");
//             }

//             // CANVAS rendering
// ;

//         };
