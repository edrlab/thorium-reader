// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { createLoadingIconElement } from "../loading";
import { createAnnotationDiv } from "./annotation";
import { createCanvas } from "./canvas";

export const PAGE_NUMBER_ATT = "data-page-number";

export interface ICreatePageElementPayload {
    // pageNumber: number;
    viewportSize: {width: number, height: number};
    hiddenWhenDisabled: boolean;
}

const createPageDivElement = (
    {/*pageNumber*/viewportSize: { width, height } }: ICreatePageElementPayload,
    rootElement?: HTMLElement,
): [el: HTMLDivElement, enable: () => any, disable: () => any] => {

    const pageDiv = document.createElement("div");
    pageDiv.setAttribute("style", "display: block; position: absolute; left: 0; top: 0;");
    pageDiv.style.width = `${width}px`;
    pageDiv.style.height = `${height}px`;
    // pageDiv.setAttribute(PAGE_NUMBER_ATT, pageNumber.toString());

    rootElement?.appendChild(pageDiv);

    return [
        pageDiv,
        () => pageDiv.style.display = "",
        () => pageDiv.style.display = "none",
    ];
};

export interface IPageHTMLEL { canvas?: HTMLCanvasElement; annotationDiv?: HTMLDivElement; pageDiv: HTMLDivElement; }

export const createPageElement = (
    payload: ICreatePageElementPayload,
    // renderingFct: (
    //     pageNumber: number,
    //     viewportSize: { width: number, height: number },
    //     canvas: HTMLCanvasElement,
    //     annotationDiv: HTMLDivElement,
    // ) => Promise<void>,
    rootElement?: HTMLElement,
): [
    enable: () => () => void,
    disable: () => void,
    el: IPageHTMLEL,
] => {
    const {
        hiddenWhenDisabled,
    } = payload;

    const [pageDiv, enablePage, disablePage] = createPageDivElement(payload);

    const [enableLoading, disableLoading] = createLoadingIconElement(pageDiv);

    rootElement.appendChild(pageDiv);

    const el: IPageHTMLEL = { pageDiv };
    return [
        () => {

            enableLoading();
            el.canvas = createCanvas(pageDiv);
            el.annotationDiv = createAnnotationDiv(pageDiv);

            enablePage();

            return () => disableLoading();
        },
        () => {
            if (hiddenWhenDisabled) {
                disableLoading();
                disablePage();
            } else {
                enableLoading();
            }

            el.canvas?.remove();
            el.annotationDiv?.remove();
        },
        el,
    ];
};
