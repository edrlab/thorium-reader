// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { remote } from "electron";
import * as path from "path";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import { _RENDERER_PDF_WEBVIEW_BASE_URL, IS_DEV } from "readium-desktop/preprocessor-directives";

import { eventBus } from "./common/eventBus";
import { IEventBusPdfPlayer } from "./common/pdfReader.type";

// bridge between webview tx-rx communication and reader.tsx

export async function pdfMountWebview(
    pdfPath: string,
    publicationViewport: HTMLDivElement,
): Promise<[bus: IEventBusPdfPlayer, toc: Link[] | undefined]> {

    const webview = document.createElement("webview");

    let rendererBaseUrl = _RENDERER_PDF_WEBVIEW_BASE_URL;
    if (rendererBaseUrl === "file://") {
        // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += path.normalize(path.join(__dirname, "index_pdf.html"));
    } else {
        // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
        rendererBaseUrl += "index_pdf.html";
    }
    rendererBaseUrl = rendererBaseUrl.replace(/\\/g, "/");
    webview.src = rendererBaseUrl;

        // tslint:disable-next-line:max-line-length
    // https://github.com/electron/electron/blob/master/docs/tutorial/security.md#3-enable-context-isolation-for-remote-content
    webview.setAttribute("webpreferences",
        "nodeIntegration=1, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
        "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0, enableRemoteModule=0");
    webview.addEventListener("dom-ready", () => {
        // https://github.com/electron/electron/blob/v3.0.0/docs/api/breaking-changes.md#webcontents

        webview.clearHistory();

        if (IS_DEV) {
            const wc = remote.webContents.fromId(webview.getWebContentsId());
            // const wc = wv.getWebContents();

            wc.on("context-menu", (_ev, params) => {
                const { x, y } = params;
                const openDevToolsAndInspect = () => {
                    const devToolsOpened = () => {
                        wc.off("devtools-opened", devToolsOpened);
                        wc.inspectElement(x, y);

                        setTimeout(() => {
                            if (wc.devToolsWebContents && wc.isDevToolsOpened()) {
                                wc.devToolsWebContents.focus();
                            }
                        }, 500);
                    };
                    wc.on("devtools-opened", devToolsOpened);
                    wc.openDevTools({ activate: true, mode: "detach" });
                };
                remote.Menu.buildFromTemplate([{
                    click: () => {
                        const wasOpened = wc.isDevToolsOpened();
                        if (!wasOpened) {
                            openDevToolsAndInspect();
                        } else {
                            if (!wc.isDevToolsFocused()) {
                                // wc.toggleDevTools();
                                wc.closeDevTools();

                                setImmediate(() => {
                                    openDevToolsAndInspect();
                                });
                            } else {
                                // right-click context menu normally occurs when focus
                                // is in BrowserWindow / WebView's WebContents,
                                // but some platforms (e.g. MacOS) allow mouse interaction
                                // when the window is in the background.
                                wc.inspectElement(x, y);
                            }
                        }
                    },
                    label: "Inspect element",
                }]).popup({ window: remote.getCurrentWindow() });
            });
        }
    });

    const bus: IEventBusPdfPlayer = eventBus(
        (key, ...a) => {
            const data = {
                key: JSON.stringify(key),
                payload: JSON.stringify(a),
            };

            // tslint:disable-next-line: no-floating-promises
            webview.send("pdf-eventbus", data);
        },
        (ev) => {
            webview.addEventListener("ipc-message", (event) => {

                const channel = event.channel;
                if (channel === "pdf-eventbus") {

                    const message = event.args[0];
                    console.log("pdf-eventbus received", event, message);

                    const key = typeof message?.key !== "undefined" ? JSON.parse(message.key) : undefined;
                    const data = typeof message?.payload !== "undefined" ? JSON.parse(message.payload) : [];

                    if (Array.isArray(data)) {
                        ev(key, ...data);
                    }
                }
            });
        },
    );

    webview.addEventListener("console-message", (e) => {
        console.log("pdf-webview", e.message);
    });

    publicationViewport.append(webview);

    webview.addEventListener("did-finish-load", () => {

        bus.dispatch("start", pdfPath);
    });

    const toc = await Promise.race([
        new Promise<void>((_r, reject) => setTimeout(() => reject("TIMEOUT"), 50000)),
        new Promise<Link[]>((resolve) => bus.subscribe("ready", (t) => resolve(t))),
    ]);

    if (Array.isArray(toc)) {
        return [bus, toc];
    }

    return [bus, undefined];

}
