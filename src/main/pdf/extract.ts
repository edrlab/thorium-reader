// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as path from "path";
// import * as fs from "fs";
import { BrowserWindow, Event as ElectronEvent, HandlerDetails, shell, WebContentsWillNavigateEventParams } from "electron";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { IInfo } from "./extract.type";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_EXTRACT_PDF } from "readium-desktop/common/streamerProtocol";

const ENABLE_DEV_TOOLS = __TH__IS_DEV__ || __TH__IS_CI__;

const debug = debug_("readium-desktop:main/pdf/extract/index.ts");
debug("_");

type TExtractPdfData = [data: IInfo | undefined, coverPNG: Buffer | undefined];
export const extractPDFData =
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
        // (really, the double-encoding is for "viewer.html?file=" in loadURL() below!)

        pdfPath = "pdfjs-extract://host/" + encodeURIComponent_RFC3986(encodeURIComponent_RFC3986(pdfPath));
        debug("extractPDFData", pdfPath);

        let win: BrowserWindow;
        try {

            //`${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_EXTRACT_PDF}/pdfjs/../../../index_pdf.js`
            const preloadPath = path.normalize(path.join(__dirname, "index_pdf_extract.js")).replace(/\\/g, "/");
            debug("extractPDFData preload", preloadPath); // fs.existsSync(preloadPath)

            win = new BrowserWindow({
                width: 800,
                height: 600,
                // show: false,
                webPreferences: {
                    // enableRemoteModule: false,
                    allowRunningInsecureContent: false,
                    backgroundThrottling: true,
                    devTools: ENABLE_DEV_TOOLS, // this does not automatically open devtools, just enables them (see Electron API openDevTools())
                    nodeIntegration: false,
                    sandbox: true,
                    contextIsolation: true,
                    nodeIntegrationInWorker: false,
                    webSecurity: true,
                    webviewTag: false,
                    preload: preloadPath, // "file://" + ... when setting the "preload" attribute on webview, but not with webPreferences
                    partition: "persist:partitionpdfjsextract",
                },
            });

            // win.hide(); // doesn't works on linux
            await win.loadURL(`${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_EXTRACT_PDF}/pdfjs/web/viewer.html?file=${pdfPath}`);

            const willNavigate = (navUrl: string | undefined | null) => {

                if (!navUrl) {
                    debug("willNavigate ==> nil: ", navUrl);
                    return;
                }

                if (/^https?:\/\//.test(navUrl)) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.

                    debug("willNavigate ==> EXTERNAL: ", win.webContents.getURL(), " *** ", navUrl);
                    setTimeout(async () => {
                        await shell.openExternal(navUrl);
                    }, 0);

                    return;
                }

                debug("willNavigate ==> noop: ", navUrl);
            };

            win.webContents.setWindowOpenHandler((details: HandlerDetails) => {
                debug("BrowserWindow.webContents.setWindowOpenHandler (always DENY): ", win.webContents.id, " --- ", details.url, " === ", win.webContents.getURL());

                willNavigate(details.url);

                return { action: "deny" };
            });

            win.webContents.on("will-navigate", (details: ElectronEvent<WebContentsWillNavigateEventParams>, url: string) => {
                debug("BrowserWindow.webContents.on('will-navigate') (always PREVENT): ", win.webContents.id, " --- ", details.url, " *** ", url, " === ", win.webContents.getURL());

                details.preventDefault();

                willNavigate(details.url);
            });

            const pdata = new Promise<TExtractPdfData>((resolve) =>
                win.webContents.on("ipc-message", (e, c, ...arg) => {
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
                (resolve) => setTimeout(() => resolve([undefined, undefined]), 15000));

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
