// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { ipcRenderer, shell, WillNavigateEvent } from "electron";
import * as path from "path";
import {
    _DIST_RELATIVE_URL, _PACKAGING, _RENDERER_PDF_WEBVIEW_BASE_URL, IS_DEV,
} from "readium-desktop/preprocessor-directives";

import { CONTEXT_MENU_SETUP } from "@r2-navigator-js/electron/common/context-menu";
import {
    convertCustomSchemeToHttpUrl, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { eventBus } from "./common/eventBus";
import { IEventBusPdfPlayer } from "./common/pdfReader.type";

// bridge between webview tx-rx communication and reader.tsx

export function createOrGetPdfEventBus(): IEventBusPdfPlayer {

  if ((window as any).pdfEventBus) {
    return (window as any).pdfEventBus;
  }
  const bus: IEventBusPdfPlayer = eventBus(
          (key, ...a) => {
              const data = {
                  key: JSON.stringify(key),
                  payload: JSON.stringify(a),
              };

              const webview = document.getElementById("publication_viewport")?.firstElementChild as (Electron.WebviewTag | null);

              webview?.send("pdf-eventbus", data);
          },
          (ev) => {
            const webview = document.getElementById("publication_viewport")?.firstElementChild as (Electron.WebviewTag | null);
            if (!webview) {
              return false;
            }
            webview?.addEventListener("ipc-message", (event) => {
                  // console.log("ipc-message ...");
                  const channel = event.channel;
                  if (channel === "pdf-eventbus") {

                      const message = event.args[0];
                      try {

                          const key = typeof message?.key !== "undefined" ? JSON.parse(message.key) : undefined;
                          const data = typeof message?.payload !== "undefined" ? JSON.parse(message.payload) : [];
                          console.log("ipc-message pdf-eventbus received", key, data);

                          if (Array.isArray(data)) {
                              ev(key, ...data);
                          }
                      } catch (e) {
                          console.log("ipc message pdf-eventbus received with parsing error", e);
                      }

                  }
              });
            return true;
          },
      );
  (window as any).pdfEventBus = bus;
  return bus;
}

export function pdfMount(
    pdfPath: string,
    publicationViewport: HTMLDivElement,
) {

    if (pdfPath.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL)) {
        pdfPath = convertCustomSchemeToHttpUrl(pdfPath);
    }

    console.log("pdfPath ADJUSTED", pdfPath);

    const webview = document.createElement("webview");

    // Redirect link to an external browser
    const handleRedirect = async (event: WillNavigateEvent) => {
        event.preventDefault(); // no effect
        event.stopPropagation();

        console.log("WillNavigate event:", event.type, event.url);
        if (event.url) {
            await shell.openExternal(event.url);
        }
    };
    webview.addEventListener("will-navigate", handleRedirect);

    webview.addEventListener("console-message", (e) => {
        console.log("pdf-webview", e.message);
    });

    webview.addEventListener("dom-ready", webviewDomReadyDebugger);

    webview.addEventListener("did-finish-load", () => {

        console.log("did-finish-load createOrGetPdfEventBus().dispatch start pdfPath", pdfPath);
        createOrGetPdfEventBus().dispatch("start", pdfPath);
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
    // let htmlPath = "index_pdf.html";
    // if (_PACKAGING === "1") {
    //     htmlPath = "file://" + path.normalize(path.join((global as any).__dirname, htmlPath));
    // } else {
    //     if (_RENDERER_PDF_WEBVIEW_BASE_URL === "file://") {
    //         // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
    //         htmlPath = "file://" +
    //             path.normalize(path.join((global as any).__dirname, _DIST_RELATIVE_URL, htmlPath));
    //     } else {
    //         // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
    //         htmlPath = "file://" + path.normalize(path.join(process.cwd(), "dist", htmlPath));
    //     }
    // }
    // htmlPath = htmlPath.replace(/\\/g, "/");

    webview.setAttribute("style",
        "display: flex; margin: 0; padding: 0; box-sizing: border-box; position: absolute; left: 0; right: 0; bottom: 0; top: 0;");
    // webview.setAttribute("partition", "persist:pdfjsreader");
    webview.setAttribute("webpreferences",
        `enableRemoteModule=0, allowRunningInsecureContent=0, backgroundThrottling=0, devTools=${IS_DEV ? "1" : "0"}, nodeIntegration=0, contextIsolation=0, nodeIntegrationInWorker=0, sandbox=0, webSecurity=1, webviewTag=0`);
    // webview.setAttribute("disablewebsecurity", "");

    webview.setAttribute("preload", preloadPath);
    webview.setAttribute("src", "pdfjs://local/web/viewer.html?file=" + encodeURIComponent_RFC3986(pdfPath));

    publicationViewport.append(webview);
}

const webviewDomReadyDebugger = (ev: DOMEvent) => {
    // https://github.com/electron/electron/blob/v3.0.0/docs/api/breaking-changes.md#webcontents

    const webview = ev.target as Electron.WebviewTag;

    webview.clearHistory();

    if (IS_DEV) {
        ipcRenderer.send(CONTEXT_MENU_SETUP, webview.getWebContentsId());
    }
};
