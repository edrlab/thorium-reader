// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow } from "electron";

// Logger
const debug = debug_("readium-desktop:main/pdf/cover");

export async function generatePdfCover(pdfPath: string, width: number, height: number): Promise<Buffer> {

    debug("generatePdfCover", pdfPath, width, height);

    const win = new BrowserWindow({ width, height });

    win.hide();

    const url = `${pdfPath}#page=1&toolbar=0&statusbar=0&messages=0&navpanes=0&scrollbar=0&view=Fit`;
    debug("pdf file url", url);
    await win.loadFile(pdfPath);

    const nativeImage = await win.capturePage();

    const pngBuffer = nativeImage.toPNG();

    win.close();

    return pngBuffer;

}
