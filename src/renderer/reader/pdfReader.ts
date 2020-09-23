// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import * as pdfJs from "pdfjs-dist";
import { eventBus, IEventBus } from "readium-desktop/utils/eventBus";

// webpack.config.renderer-reader.js
pdfJs.GlobalWorkerOptions.workerSrc = "./pdf.worker.js";

export async function pdfReaderMountingPoint(
    rootElement: HTMLDivElement,
    pdfPath: string,
): Promise<IEventBus> {

    const { slave, master } = eventBus();

    const canvas = document.createElement("canvas");
    rootElement.appendChild(canvas);

    canvas.width = rootElement.clientWidth;
    canvas.height = rootElement.clientHeight;

    const pdf = await pdfJs.getDocument(pdfPath).promise;

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
