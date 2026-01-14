// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { ipcRenderer } from "electron";
import * as path from "path";
import {
    _DIST_RELATIVE_URL, _RENDERER_PDF_WEBVIEW_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import { CONTEXT_MENU_SETUP } from "@r2-navigator-js/electron/common/context-menu";
import {
    convertCustomSchemeToHttpUrl, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { eventBus } from "./common/eventBus";
import { IEventBusPdfPlayer } from "./common/pdfReader.type";
import { URL_PROTOCOL_THORIUMHTTPS, URL_HOST_COMMON, URL_PATH_PREFIX_PDFJS } from "readium-desktop/common/streamerProtocol";
import { SESSION_PARTITION_PDFJS } from "readium-desktop/common/sessions";
import { URL_PROTOCOL_FILEX } from "readium-desktop/common/streamerProtocol";
import { getStore } from "../createStore";

const ENABLE_DEV_TOOLS = __TH__IS_DEV__ || __TH__IS_CI__;

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
                          const data = typeof message?.payload !== "undefined" ? typeof message.payload === "string" ? JSON.parse(message.payload) : message.payload : [];
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
    data: {
        page: string,
        zoom: string,
        // scrollLeft: number,
        scrollTop: number,
        // rotation: number,
        // sidebarView: number,
        // scrollMode: number,
        // spreadMode: number,
    }
) {

    if (pdfPath.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL)) {
        pdfPath = convertCustomSchemeToHttpUrl(pdfPath);
    }

    console.log("pdfPath ADJUSTED", pdfPath);

    const pdfData = data;
    const pdfDataString = JSON.stringify(pdfData);
    const b64EncodedPdfData = Buffer.from(pdfDataString, "utf8").toString("base64");

    const webview = document.createElement("webview");

    // // Redirect link to an external browser ALREADY HANDLED in navigator by child created webviews! See "@r2-navigator-js/electron/main/browser-window-tracker"
    // const handleRedirect = async (event: WillNavigateEvent) => {
    //     event.preventDefault(); // no effect
    //     event.stopPropagation();

    //     console.log("will-navigate event:", event.type, event.url);
    //     if (event.url && /^https?:\/\//.test(event.url)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
    //         await shell.openExternal(event.url);
    //     }
    // };
    // webview.addEventListener("will-navigate", handleRedirect);

    webview.addEventListener("console-message", (e) => {
        console.log("pdf-webview", e.message);
    });

    webview.addEventListener("dom-ready", webviewDomReadyDebugger);

    webview.addEventListener("did-finish-load", () => {

        console.log("did-finish-load createOrGetPdfEventBus().dispatch start pdfPath", pdfPath);
        const store = getStore();
        const pdfConfig = store.getState().reader.pdfConfig;
        createOrGetPdfEventBus().dispatch("start", pdfPath, pdfConfig?.scale || "page-fit", pdfConfig.spreadmode || 0);
    });

    // (global as any).__dirname
    // BROKEN when index_reader.js is not served via file://
    // ... so instead window.location.href provides dist/index_reader.html which is co-located:
    // path.normalize(path.join(window.location.pathname.replace(/^\/\//, "/"), "..")) etc.

    const PDFPATH = "index_pdf.js";
    let preloadPath = PDFPATH;
    if (__TH__IS_PACKAGED__) {
        preloadPath = "file://" + path.normalize(path.join(window.location.pathname.replace(/^\/\//, "/"), "..", PDFPATH)).replace(/\\/g, "/");
    } else {
        if (_RENDERER_PDF_WEBVIEW_BASE_URL === `${URL_PROTOCOL_FILEX}://${URL_HOST_COMMON}/`) {
            // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
            preloadPath = "file://" + path.normalize(path.join(window.location.pathname.replace(/^\/\//, "/"), "..", PDFPATH)).replace(/\\/g, "/");

            // const debugStr = `[[PDF DRIVER ${preloadPath} >>> ${window.location.href} *** ${window.location.pathname} === ${process.cwd()} ^^^ ${(global as any).__dirname} --- ${_DIST_RELATIVE_URL} @@@ ${preloadPath}]]`;
            // if (document.body.firstElementChild) {
            //     document.body.innerText = debugStr;
            // } else {
            //     document.body.innerText += debugStr;
            // }
        } else {
            // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
            preloadPath = "file://" + path.normalize(path.join(process.cwd(), "dist", PDFPATH));
            preloadPath = preloadPath.replace(/\\/g, "/");
        }
    }

    webview.setAttribute("style",
        "display: flex; margin: 0; padding: 0; box-sizing: border-box; position: absolute; left: 0; right: 0; bottom: 0; top: 0;");

    webview.setAttribute("webpreferences",
        `enableRemoteModule=0, allowRunningInsecureContent=0, backgroundThrottling=0, devTools=${ENABLE_DEV_TOOLS ? "1" : "0"}, nodeIntegration=0, sandbox=1, contextIsolation=0, nodeIntegrationInWorker=0, webSecurity=1, webviewTag=0, partition=${SESSION_PARTITION_PDFJS}`);
    // webview.setAttribute("disablewebsecurity", "");
    webview.setAttribute("partition", SESSION_PARTITION_PDFJS);

    webview.setAttribute("preload", preloadPath);
    webview.setAttribute("src",
        `${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}/${URL_PATH_PREFIX_PDFJS}/web/viewer.html?file=${encodeURIComponent_RFC3986(pdfPath)}&thoriumpdfdata=${encodeURIComponent_RFC3986(b64EncodedPdfData)}`);

    publicationViewport.append(webview);
}

const webviewDomReadyDebugger = (ev: DOMEvent) => {
    // https://github.com/electron/electron/blob/v3.0.0/docs/api/breaking-changes.md#webcontents

    const webview = ev.target as Electron.WebviewTag;

    webview.clearHistory();

    if (__TH__IS_DEV__) {
        ipcRenderer.send(CONTEXT_MENU_SETUP, webview.getWebContentsId());
    }
};
