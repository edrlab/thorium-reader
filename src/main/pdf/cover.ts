// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow } from "electron";
import * as fs from "fs";
import { createServer, Server } from "http";
import { getPortPromise } from "portfinder";
import { mimeTypes } from "readium-desktop/utils/mimeTypes";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { pipeline } from "stream";

// Logger
const debug = debug_("readium-desktop:main/pdf/cover");

async function generatePdfCover(pdfPath: string, width: number, height: number): Promise<Buffer> {

    debug("generatePdfCover", pdfPath, width, height);

    let server: Server;
    let win: BrowserWindow;

    try {
        win = new BrowserWindow({
            width: Math.round(width),
            height: Math.round(height),
        });

        win.hide();

        const stream = fs.createReadStream(pdfPath);
        server = createServer((req, res) => {

            try {

                debug("request incoming", req.url);
                debug(req.statusCode);
                debug(req.statusMessage);
                debug(req.headers);
                // debug(req.rawHeaders);
                debug(req.httpVersion);
                debug(req.method);

                res.writeHead(200, { "Content-Type": mimeTypes.pdf });

                pipeline(stream, res, (err) => err && debug("pipeline", err));

            } catch (e) {

                debug("server request", e);
                res.writeHead(500);
                res.end();
            }
        });

        const port = await getPortPromise();
        server.listen(port);

        const url = `http://127.0.0.1:${port}#page=1&toolbar=0&statusbar=0&messages=0&navpanes=0&scrollbar=0&view=Fit`;
        debug("pdf file url", url);

        await win.loadURL(url);

        await new Promise<void>((resolve) => setTimeout(() => resolve(), 7000));

        const nativeImage = await win.capturePage();

        const pngBuffer = nativeImage.toPNG();

        return pngBuffer;

    } finally {

        if (server) {
            server.close();
        }

        if (win) {
            win.close();
        }

    }
}

export async function pdfCover(pdfPath: string, manifest: R2Publication) {

    const resources = manifest.Resources;
    if (Array.isArray(resources)) {

        const { Width, Height, Rel } = manifest.Resources[0];
        if (Rel.includes("cover")) {

            const pngBuffer = await generatePdfCover(pdfPath, Width, Height);
            return pngBuffer;
        }
    }

    return undefined;
}
