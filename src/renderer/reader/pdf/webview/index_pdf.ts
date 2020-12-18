// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { debounce } from "debounce";
import { ipcRenderer } from "electron";
import { PDFDocumentProxy } from "pdfjs-dist/types/display/api";

import {
    IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN, IEventPayload_R2_EVENT_WEBVIEW_KEYUP,
} from "@r2-navigator-js/electron/common/events";

import { eventBus } from "../common/eventBus";
import {
    IEventBusPdfPlayer, IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView,
} from "../common/pdfReader.type";
import { EventBus } from "./pdfEventBus";
// import { pdfReaderInit } from "./init";
import { IStore } from "./store";
import { getToc } from "./toc";

export interface IPdfState {
    view: IPdfPlayerView;
    scale: IPdfPlayerScale;
    column: IPdfPlayerColumn;
    lastPageNumber: number;
    displayPage: (pageNumber: number) => Promise<void>;
}

export type IPdfStore = IStore<IPdfState>;
export type IPdfBus = IEventBusPdfPlayer;

const pdfjsEventBus = new EventBus();
pdfjsEventBus.onAll((key: any) => (...arg: any[]) => console.log("PDFJS EVENTBUS", key, ...arg));
(window as any).pdfjsEventBus = pdfjsEventBus;

const pdfDocument = new Promise<PDFDocumentProxy>((resolve) =>
    pdfjsEventBus.on("__pdfdocument", (_pdfDocument: PDFDocumentProxy) => {
        resolve(_pdfDocument);
    }));

function main() {

    const bus: IPdfBus = eventBus(
        (key, ...a) => {
            const data = {
                key: JSON.stringify(key),
                payload: JSON.stringify(a),
            };

            ipcRenderer.sendToHost("pdf-eventbus", data);
        },
        (ev) => {
            ipcRenderer.on("pdf-eventbus", (_event, message) => {

                try {

                    const key = typeof message?.key !== "undefined" ? JSON.parse(message.key) : undefined;
                    const data = typeof message?.payload !== "undefined" ? JSON.parse(message.payload) : [];
                    console.log("ipcRenderer pdf-eventbus received", key, data);

                    if (Array.isArray(data)) {
                        ev(key, ...data);
                    }
                } catch (e) {
                    console.log("ipcRenderer pdf-eventbus received with parsing error", e);
                }

            });
        },
    );

    const defaultView: IPdfPlayerView = "paginated";
    const defaultScale: IPdfPlayerScale = "fit";
    const defaultCol: IPdfPlayerColumn = "1";

    // start dispatched from webview dom ready
    bus.subscribe("start", async (pdfPath: string) => {

        pdfDocument.then(async (pdf) => {

            console.log("PDFDOC LOADED");

            const toc = await getToc(pdf);

            console.log("TOC");
            console.log(toc);

            bus.dispatch("toc", toc);

        }).catch((e) => console.error(e));

        console.log("bus.subscribe start pdfPath", pdfPath);
        // const store = await pdfReaderInit(rootElement, pdfPath, bus, {
        //     view: defaultView,
        //     scale: defaultScale,
        //     column: defaultCol,
        // });

        // evState.store = store;

        bus.dispatch("scale", defaultScale);
        bus.dispatch("view", defaultView);
        bus.dispatch("column", defaultCol);

        // send to reader.tsx ready to render pdf
    });

    {
        pdfjsEventBus.on("__ready", () => {

            bus.dispatch("ready");
        });
    }

    // search
    {

        // https://github.com/mozilla/pdf.js/blob/c366390f6bb2fa303d0d85879afda2c27ee06c28/web/pdf_find_bar.js#L930
        const dispatchEvent = (type: any, findPrev?: any) => {
            pdfjsEventBus.dispatch("find", {
              source: null,
              type,
              query: searchRequest,
              phraseSearch: true,
              caseSensitive: false,
              entireWord: false,
              highlightAll: true,
              findPrevious: findPrev,
            });
          };

        let searchRequest = "";
        bus.subscribe("search", (txt) => {
            searchRequest = txt;
            dispatchEvent("");
        });
        bus.subscribe("search-next", () => {
            dispatchEvent("again", false);
        });
        bus.subscribe("search-previous", () => {
            dispatchEvent("again", true);
        });
        bus.subscribe("search-wipe", () => {
            pdfjsEventBus.dispatch("findbarclose", { source: null });
        });
        pdfjsEventBus.on("updatefindmatchescount", ({ matchesCount: { total = 0 /* current */ } }: any) => {
            bus.dispatch("search-found", total);
        });
    }

    const p = new Promise<void>((resolve) => pdfjsEventBus.on("documentloaded", resolve));

    // pagechange
    {
        bus.subscribe("page", (pageNumber) => {
            console.log("pageNumber from host", pageNumber);

            // tslint:disable-next-line: no-floating-promises
            p.then(() => {

                pdfjsEventBus.dispatch("pagenumberchanged", {
                    source: null,
                    value: pageNumber.toString(),
                });
            });
        });
        const debounceUpdateviewarea = debounce(async (evt: any) => {
            try {
                const { location: { pageNumber } } = evt;
                console.log("pageNumber", pageNumber);
                bus.dispatch("page", pageNumber);
            } catch (e) {
                console.log("updateviewarea ERROR", e);
            }
        }, 500);
        pdfjsEventBus.on("updateviewarea", async (evt: any) => {
            await debounceUpdateviewarea(evt);
        });

        bus.subscribe("page-next", () => {
            pdfjsEventBus.dispatch("nextpage");
        });
        bus.subscribe("page-previous", () => {
            pdfjsEventBus.dispatch("previouspage");
        });

    }

    window.document.body.addEventListener("copy", (evt: ClipboardEvent) => {
        const selection = window.document.getSelection();
        if (selection) {
            const str = selection.toString();
            if (str) {
                evt.preventDefault();

                setTimeout(() => {
                    bus.dispatch("copy", str);
                }, 500);
            }
        }
    });

    window.document.documentElement.addEventListener("keydown", (_ev: KeyboardEvent) => {
        window.document.documentElement.classList.add("ROOT_CLASS_KEYBOARD_INTERACT");
    }, true);

    window.document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {
        window.document.documentElement.classList.remove("ROOT_CLASS_KEYBOARD_INTERACT");
    }, true);

    const keyDownUpEventHandler = (name: "keydown" | "keyup") =>
        (ev: KeyboardEvent) => {
            const elementName = (ev.target && (ev.target as Element).nodeName) ?
                (ev.target as Element).nodeName : "";
            const elementAttributes: { [name: string]: string } = {};
            if (ev.target && (ev.target as Element).attributes) {
                // tslint:disable-next-line: prefer-for-of
                for (let i = 0; i < (ev.target as Element).attributes.length; i++) {
                    const attr = (ev.target as Element).attributes[i];
                    elementAttributes[attr.name] = attr.value;
                }
            }
            const payload = {
                altKey: ev.altKey,
                code: ev.code,
                ctrlKey: ev.ctrlKey,
                elementAttributes,
                elementName,
                key: ev.key,
                metaKey: ev.metaKey,
                shiftKey: ev.shiftKey,
            } as IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN | IEventPayload_R2_EVENT_WEBVIEW_KEYUP;

            bus.dispatch(name, payload);
        };

    window.document.addEventListener("keydown",
        keyDownUpEventHandler("keydown"),
        {
            capture: true,
            once: false,
            passive: false,
        });
    window.document.addEventListener("keyup",
        keyDownUpEventHandler("keyup"),
        {
            capture: true,
            once: false,
            passive: false,
        });

}

document.addEventListener("DOMContentLoaded", () => {
    main();
});
