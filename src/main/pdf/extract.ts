// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IS_DEV } from "readium-desktop/preprocessor-directives";
import * as debug_ from "debug";
import { BrowserWindow } from "electron";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { IInfo } from "./extract.type";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL } from "readium-desktop/common/streamerProtocol";

import { readFile } from "node:fs/promises";

import * as mupdfjs from "mupdf";

const debug = debug_("readium-desktop:main/pdf/extract/index.ts");
debug("_");

type TExtractPdfData = [data: IInfo | undefined, coverPNG: Buffer | undefined];

export const extractPDFData = async (pdfPath: string): Promise<TExtractPdfData> => {

    try {
        const pdfBuffer = await readFile(pdfPath);

        const doc = mupdfjs.PDFDocument.openDocument(pdfBuffer, "application/pdf");

        const info: IInfo = {
            Title: doc.getMetaData("info:Title"),
            Subject: doc.getMetaData("info:Subject"),
            Keywords: doc.getMetaData("info:Keywords"),
            Author: doc.getMetaData("info:Author"),
            Creator: doc.getMetaData("info:Creator"),
            Producer: doc.getMetaData("info:Producer"),
            CreationDate: doc.getMetaData("info:CreationDate"),
            ModDate: doc.getMetaData("info:ModDate"),
            numberOfPages: doc.countPages(),
        };

        const page = new mupdfjs.PDFPage(doc, 0);

        const pixmap = page.toPixmap(mupdfjs.Matrix.identity, mupdfjs.ColorSpace.DeviceRGB, false, true);
        const pngImage = pixmap.asPNG();
        const img = Buffer.alloc(pngImage.byteLength);
        for (let i = 0; i < img.length; ++i) {
            img[i] = pngImage[i];
        }

        return [info, img];


    } catch (e) {

        debug("####");
        debug("####");
        debug(e);
        debug("####");
        debug("####");
    }

    return [undefined, undefined];
};

export const extractPDFDataPdfjs =
    async (pdfPath: string)
        : Promise<TExtractPdfData> => {

        // e.g.
        // /PATH/TO/この世界の謎 %_%20-%2F=.pdf
        // encodeURIComponent():
        // %2FPATH%2FTO%2F%E3%81%93%E3%81%AE%E4%B8%96%E7%95%8C%E3%81%AE%E8%AC%8E%20%25_%2520-%252F%3D.pdf
        // ( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent )
        //
        // ... but the Electron registerFileProtocol() handler receives:
        // /PATH/TO/%E3%81%93%E3%81%AE%E4%B8%96%E7%95%8C%E3%81%AE%E8%AC%8E %_%20-%2F=.pdf
        // => unicode chars remain escaped!
        // So these must be decodeURIComponent() for filesystem API calls,
        // ...but the lonely non-encoded percent char triggers a crash if not handled correctly!
        // We double-encode the path in order to work around the registerFileProtocol() decoding behaviour:

        pdfPath = "pdfjs-extract://host/" + encodeURIComponent_RFC3986(encodeURIComponent_RFC3986(pdfPath));
        debug("extractPDFData", pdfPath);

        let win: BrowserWindow;

        try {

            win = new BrowserWindow({
                width: 800,
                height: 600,
                // show: false,
                webPreferences: {
                    // enableRemoteModule: false,
                    allowRunningInsecureContent: false,
                    backgroundThrottling: true,
                    devTools: IS_DEV, // this does not automatically open devtools, just enables them (see Electron API openDevTools())
                    nodeIntegration: true,
                    contextIsolation: false,
                    nodeIntegrationInWorker: false,
                    sandbox: false,
                    webSecurity: true,
                    webviewTag: false,
                },
            });

            // win.hide(); // doesn't works on linux
            await win.loadURL(`${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://0.0.0.0/pdfjs/web/viewer.html?file=${pdfPath}`);

            const content = win.webContents;

            const pdata = new Promise<TExtractPdfData>((resolve) =>
                content.on("ipc-message", (e, c, ...arg) => {
                    debug("IPC");
                    debug(e, c, arg);

                    if (c === "pdfjs-extract-data") {

                        const data = arg[0];

                        // const metadata = {
                        // info: data.info,
                        // metadata: data.metadata,
                        // };

                        // debug(metadata);
                        const info: IInfo = { ...(data.info || {}), numberOfPages: data.numberofpages };

                        debug(info);

                        const arrayBuffer = data.img; // backed by Uint8Contents
                        const img = Buffer.alloc(arrayBuffer.byteLength);
                        const view = new Uint8Array(arrayBuffer);
                        for (let i = 0; i < img.length; ++i) {
                            img[i] = view[i];
                        }

                        resolve([info, img]);
                    }

                }),
            );

            const pdelay = new Promise<TExtractPdfData>(
                (resolve) => setTimeout(() => resolve([undefined, undefined]), 7000));

            const dataResult = await Promise.race([
                pdelay,
                pdata,
            ]);

            return dataResult;

        } catch (e) {

            debug("####");
            debug("####");
            debug("####");

            debug(e);

            debug("####");
            debug("####");

        } finally {

            if (win) {
                win.close();
            }

        }

        return [undefined, undefined];
    };
