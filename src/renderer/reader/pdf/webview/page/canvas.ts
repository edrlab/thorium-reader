// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

export function createCanvas(rootElement?: HTMLElement): HTMLCanvasElement {

    const canvas = document.createElement("canvas");
    rootElement?.appendChild(canvas);

    canvas.width = rootElement.clientWidth;
    canvas.height = rootElement.clientHeight;
    canvas.setAttribute("style", "display: block; position: absolute; left: 0; top: 0;");

    canvas.ownerDocument.body.style.overflow = "hidden";
    canvas.ownerDocument.body.style.overflowX = "hidden";
    canvas.ownerDocument.body.style.overflowY = "hidden";

    return canvas;
}
