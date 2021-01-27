// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow } from "electron";
import {
    _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import { IInfo } from "./extract.type";

const debug = debug_("readium-desktop:main/pdf/extract/index.ts");
debug("_");

type TExtractPdfData = [data: IInfo | undefined, coverPNG: Buffer | undefined];
export const extractPDFData =
    async (pdfPath: string)
        : Promise<TExtractPdfData> => {

        pdfPath = "pdfjs-extract://" + encodeURIComponent(pdfPath);

        let win: BrowserWindow;

        try {

            win = new BrowserWindow({
                width: 800,
                height: 600,
                // show: false,
                webPreferences: {
                    nodeIntegration: true,
                },
            });

            // win.hide(); // doesn't works on linux
            await win.loadURL(`pdfjs://local/web/viewer.html?file=${pdfPath}`);

            const content = win.webContents;
            // content.openDevTools({ activate: true, mode: "detach" });

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
