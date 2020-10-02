// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { remote } from "electron";
import * as path from "path";
import {
    _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { keyDownEventHandler, keyUpEventHandler } from "readium-desktop/renderer/common/keyboard";

import {
    IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN,
    IEventPayload_R2_EVENT_WEBVIEW_KEYUP, R2_EVENT_CLIPBOARD_COPY, R2_EVENT_WEBVIEW_KEYDOWN,
    R2_EVENT_WEBVIEW_KEYUP,
} from "@r2-navigator-js/electron/common/events";

import { eventBus } from "./common/eventBus";
import { IEventBusPdfPlayer, TToc } from "./common/pdfReader.type";

// bridge between webview tx-rx communication and reader.tsx

export async function pdfMountWebview(
    pdfPath: string,
    publicationViewport: HTMLDivElement,
    clipboardInterceptor: (clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => void,
): Promise<[bus: IEventBusPdfPlayer, toc: TToc | undefined]> {

    const webview = document.createElement("webview");
    webview.setAttribute("style",
        "display: flex; margin: 0; padding: 0; box-sizing: border-box; position: absolute; left: 0; right: 0; bottom: 0; top: 0;");

    let htmlPath = "index_pdf.html";
    if (_PACKAGING === "1") {
        htmlPath = "file://" + path.normalize(path.join((global as any).__dirname, htmlPath));
    } else {
        if (_RENDERER_PDF_WEBVIEW_BASE_URL === "file://") {
            // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
            htmlPath = "file://" +
                path.normalize(path.join((global as any).__dirname, _DIST_RELATIVE_URL, htmlPath));
        } else {
            // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
            htmlPath = "file://" + path.normalize(path.join(process.cwd(), "dist", htmlPath));
        }
    }
    htmlPath = htmlPath.replace(/\\/g, "/");

    // tslint:disable-next-line:max-line-length
    // https://github.com/electron/electron/blob/master/docs/tutorial/security.md#3-enable-context-isolation-for-remote-content
    // webview.setAttribute("webpreferences",
    //     "nodeIntegration=1, nodeIntegrationInWorker=0, sandbox=0, javascript=1, " +
    //     "contextIsolation=0, webSecurity=1, allowRunningInsecureContent=0, enableRemoteModule=0");
    // webview.setAttribute("nodeIntegration", "");
    // webview.setAttribute("disablewebsecurity", "");
    // webview.setAttribute("webpreferences",
    //     "sandbox=0, javascript=1, contextIsolation=0, webSecurity=0, allowRunningInsecureContent=1");

    webview.addEventListener("ipc-message", (event: Electron.IpcMessageEvent) => {
        const wv = event.currentTarget as Electron.WebviewTag;
        if (webview !== wv) {
            console.log("Wrong PDF webview?!");
            return;
        }
        if (event.channel === R2_EVENT_WEBVIEW_KEYDOWN) {
            const payload = event.args[0] as IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN;
            keyDownEventHandler(payload, payload.elementName, payload.elementAttributes);
        } else if (event.channel === R2_EVENT_WEBVIEW_KEYUP) {
            const payload = event.args[0] as IEventPayload_R2_EVENT_WEBVIEW_KEYUP;
            keyUpEventHandler(payload, payload.elementName, payload.elementAttributes);
        } else if (event.channel === R2_EVENT_CLIPBOARD_COPY) {
            if (clipboardInterceptor) {
                const payload = event.args[0] as IEventPayload_R2_EVENT_CLIPBOARD_COPY;
                clipboardInterceptor(payload);
            }
        }
    });

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
                    try {
                        // tslint:disable-next-line: max-line-length
                        console.log("ipc-message pdf-eventbus received", JSON.parse(message.key), JSON.parse(message.payload));
                    } catch (e) {
                        console.log("ipc message pdf-eventbus received with parsing error", e);
                    }

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

        console.log("did-finish-load bus.dispatch start pdfPath", pdfPath);
        bus.dispatch("start", pdfPath);
    });

    let preloadPath = "index_pdf.js";
    if (_PACKAGING === "1") {
        preloadPath = "file://" + path.normalize(path.join((global as any).__dirname, preloadPath));
    } else {
        if (_RENDERER_PDF_WEBVIEW_BASE_URL === "file://") {
            // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
            preloadPath = "file://" +
                path.normalize(path.join((global as any).__dirname, _DIST_RELATIVE_URL, preloadPath));
        } else {
            // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
            preloadPath = "file://" + path.normalize(path.join(process.cwd(), "dist", preloadPath));
        }
    }
    preloadPath = preloadPath.replace(/\\/g, "/");

    webview.setAttribute("preload", preloadPath);

    // webview.src = rendererBaseUrl;
    webview.setAttribute("src", htmlPath);

    const toc = await Promise.race([
        new Promise<void>((_r, reject) => setTimeout(() => reject("TIMEOUT"), 50000)),
        new Promise<TToc>((resolve) => bus.subscribe("ready", (t) => resolve(t))),
    ]);

    if (Array.isArray(toc)) {
        return [bus, toc];
    }

    return [bus, undefined];

}
