// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { IEVState } from "../index_pdf";
import { createPageElement } from "./page";
import { renderAnnotationData } from "./render/annotation";
import { renderCanvas } from "./render/canvas";

export const renderPage = (di: IEVState) =>
    async (
        pageNumber: number,
        rootElement?: HTMLElement,
    ): Promise<[enable: () => Promise<void>, disable: () => void, el: {
        canvas?: HTMLCanvasElement;
        annotationDiv?: HTMLDivElement;
        pageDiv: HTMLDivElement;
    }]> => {

        const { store, pdf } = di;

        // pageSize not updated !!
        const { pageSize } = store.getState();

        console.log("pageSize", pageSize);

        const [
            enablePage,
            disablePage,
            el,
        ] = createPageElement({
            hiddenWhenDisabled: false,
            viewportSize: pageSize,
        }, rootElement);

        return [
            async () => {

                const ack = enablePage();
                const { canvas, annotationDiv } = el;

                const pdfPage = await pdf.getPage(pageNumber);
                const viewport = pdfPage.getViewport({ scale: 1, dontFlip: true});

                await renderCanvas(di)(pdfPage, canvas, viewport);
                await renderAnnotationData(di)(pdfPage, { annotationDiv, canvas }, viewport);

                ack();
            },
            () => {

                disablePage();
            },
            el,
        ];
    };
