// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import * as pdfJs from "pdfjs-dist";
import { eventBus } from "readium-desktop/utils/eventBus";

import { IEventBusPdfPlayerMaster, IEventBusPdfPlayerSlave } from "./pdfReader.type";

// webpack.config.renderer-reader.js
pdfJs.GlobalWorkerOptions.workerSrc = "./pdf.worker.js";

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

type TdestObj = { name?: string} | {num: number, gen: number};

interface IOutline extends Partial<TOutlineUnArray> {
    dest?: string | TdestObj[];
    items?: IOutline[];
}

export async function pdfReaderMountingPoint(
    rootElement: HTMLDivElement,
    pdfPath: string,
): Promise<IEventBusPdfPlayerSlave> {

    const { slave, master } = eventBus() as { master: IEventBusPdfPlayerMaster, slave: IEventBusPdfPlayerSlave};

    const canvas = document.createElement("canvas");
    rootElement.appendChild(canvas);

    canvas.width = rootElement.clientWidth;
    canvas.height = rootElement.clientHeight;

    const pdf = await pdfJs.getDocument(pdfPath).promise;
    const outline: IOutline[] = await pdf.getOutline();

    console.log(outline);
    console.log(await pdf.getDestination("p14"));

    master.subscribe("page", async (pageNumber: number) => {

        const pdfPage = await pdf.getPage(pageNumber);

        const viewportNoScale = pdfPage.getViewport({ scale: 1});
        const scale = rootElement.clientWidth / viewportNoScale.width;
        const viewport = pdfPage.getViewport({ scale });

        const canvas2d = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await pdfPage.render({
            canvasContext: canvas2d,
            viewport,
        }).promise;

        master.dispatch("page", pageNumber);
    });

    return slave;
}
