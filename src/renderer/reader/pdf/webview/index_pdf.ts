// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import debounce from "debounce";
import { ipcRenderer } from "electron"; // contextBridge

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import { PDFDocumentProxy } from "pdf.js";

import {
    IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN, IEventPayload_R2_EVENT_WEBVIEW_KEYUP,
} from "@r2-navigator-js/electron/common/events";

import { eventBus } from "../common/eventBus";
import {
    IEventBusPdfPlayer, IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView,
} from "../common/pdfReader.type";

// import { EventBus_ } from "./pdfEventBus";

// import { pdfReaderInit } from "./init";
import { getToc } from "./toc";

export interface IPdfState {
    view: IPdfPlayerView;
    scale: IPdfPlayerScale;
    column: IPdfPlayerColumn;
    lastPageNumber: number;
    displayPage: (pageNumber: number) => Promise<void>;
}

export type IPdfBus = IEventBusPdfPlayer;

// const pdfjsEventBus = new EventBus_();
// (window as any).pdfjsEventBus = pdfjsEventBus;

// (window as any).pdfjsEventBus = pdfjsEventBus;
// contextBridge.exposeInMainWorld(
//     "pdfjsEventBus",
//     {
//         dispatch: function () {
//             console.log("exposeInMainWorld pdfjsEventBus dispatch", JSON.stringify(arguments, null, 4));

//             return pdfjsEventBus.dispatch.apply(pdfjsEventBus, arguments);
//         },
//         onAll: function () {
//             console.log("exposeInMainWorld pdfjsEventBus onAll", JSON.stringify(arguments, null, 4));

//             return pdfjsEventBus.onAll.apply(pdfjsEventBus, arguments);
//         },
//         on: function () {
//             console.log("exposeInMainWorld pdfjsEventBus on", JSON.stringify(arguments, null, 4));

//             return pdfjsEventBus.on.apply(pdfjsEventBus, arguments);
//         },
//         off: function () {
//             console.log("exposeInMainWorld pdfjsEventBus off", JSON.stringify(arguments, null, 4));

//             return pdfjsEventBus.off.apply(pdfjsEventBus, arguments);
//         },
//         _on: function () {
//             console.log("exposeInMainWorld pdfjsEventBus _on", JSON.stringify(arguments, null, 4));

//             return pdfjsEventBus._on.apply(pdfjsEventBus, arguments);
//         },
//         _off: function () {
//             console.log("exposeInMainWorld pdfjsEventBus _off", JSON.stringify(arguments, null, 4));

//             return pdfjsEventBus._off.apply(pdfjsEventBus, arguments);
//         },
//     }
// );

// pdfjsEventBus.onAll((_key: any) => (..._arg: any[]) => /*console.log("PDFJS EVENTBUS", key, arg)*/ {});

// https://github.com/mozilla/pdf.js/blob/aa4b9ffd4ac985230cbbfca329322fa578b630dd/web/ui_utils.js#L193-L207
const InvisibleCharsRegExp = /[\x00-\x1F]/g;
function removeNullCharacters(str: string, replaceInvisible = false) {
    if (!InvisibleCharsRegExp.test(str)) {
        return str;
    }
    if (replaceInvisible) {
        return str.replace(InvisibleCharsRegExp, m => (m === "\x00" ? "" : " "));
    }
    return str.replace(/\x00/g, "");
}

// https://github.com/mozilla/pdf.js/blob/aa4b9ffd4ac985230cbbfca329322fa578b630dd/src/shared/util.js#L1110-L1127
let NormalizeRegex: RegExp = null;
let NormalizationMap: Map<string, string> = null;
function normalizeUnicode(str: string) {
    if (!NormalizeRegex) {
        // In order to generate the following regex:
        //  - create a PDF containing all the chars in the range 0000-FFFF with
        //    a NFKC which is different of the char.
        //  - copy and paste all those chars and get the ones where NFKC is
        //    required.
        // It appears that most the chars here contain some ligatures.
        NormalizeRegex =
        /([\u00a0\u00b5\u037e\u0eb3\u2000-\u200a\u202f\u2126\ufb00-\ufb04\ufb06\ufb20-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufba1\ufba4-\ufba9\ufbae-\ufbb1\ufbd3-\ufbdc\ufbde-\ufbe7\ufbea-\ufbf8\ufbfc-\ufbfd\ufc00-\ufc5d\ufc64-\ufcf1\ufcf5-\ufd3d\ufd88\ufdf4\ufdfa-\ufdfb\ufe71\ufe77\ufe79\ufe7b\ufe7d]+)|(\ufb05+)/gu;
        NormalizationMap = new Map([["ﬅ", "ſt"]]);
    }

    return str.replace(NormalizeRegex, (_, p1, p2) => p1 ? p1.normalize("NFKC") : NormalizationMap.get(p2));
}

function main() {

    const pdfjsEventBus = (window as any).PDFViewerApplication?.eventBus;
    (window as any).pdfjsEventBus = pdfjsEventBus;

    const pdfDocument = new Promise<PDFDocumentProxy>((resolve) =>
        pdfjsEventBus.on("__pdfdocument", (_pdfDocument: PDFDocumentProxy) => {
            resolve(_pdfDocument);
        }));

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
                    const data = typeof message?.payload !== "undefined" ? typeof message.payload === "string" ? JSON.parse(message.payload) : message.payload : [];
                    console.log("ipcRenderer pdf-eventbus received", key, data);

                    if (Array.isArray(data)) {
                        ev(key, ...data);
                    }
                } catch (e) {
                    console.log("ipcRenderer pdf-eventbus received with parsing error", e);
                }

            });

            return true;
        },
    );

    // const defaultView: IPdfPlayerView = "scrolled";
    // const defaultScale: IPdfPlayerScale = "page-fit";
    const defaultCol: IPdfPlayerColumn = "1";
    const defaultSpreadModeEven = false;

    // start dispatched from webview dom ready
    bus.subscribe("start", async (pdfPath: string, scale: IPdfPlayerScale, spreadMode: 0 | 1 | 2) => {

        pdfDocument.then(async (pdf) => {

            console.log("PDFDOC LOADED");

            const toc = await getToc(pdf);

            console.log("TOC");
            console.log(toc);

            bus.dispatch("toc", toc);
            bus.dispatch("numberofpages", pdf.numPages);

            pdfjsEventBus.dispatch("scalechanged", { value: typeof scale === "number" ? `${scale / 100}` : scale });
            pdfjsEventBus.dispatch("switchspreadmode", { mode: spreadMode });

            setTimeout(() => {
                const debounceSave = debounce(async (data: any) => {
                    bus.dispatch("savePreferences", data);
                }, 200);
                pdfjsEventBus.on("__savePreferences", async (data: any) => {
                    await debounceSave(data)
                })
            }, 100);

        }).catch((e) => console.error(e));

        console.log("bus.subscribe start pdfPath", pdfPath);

        // bus.dispatch("scale", defaultScale);
        // bus.dispatch("view", defaultView);
        // bus.dispatch("column", defaultCol);
        // bus.dispatch("spreadModeEven", defaultSpreadModeEven);

    });

    {
        bus.subscribe("print", (pageRange: number[]) => {
            pdfjsEventBus.dispatch("print", pageRange);
        })
        bus.subscribe("thumbnailRequest", (pageIndexZeroBased) => {
            pdfjsEventBus.dispatch("__thumbnailPageRequest", pageIndexZeroBased);
        })
        pdfjsEventBus.on("thumbnailrendered", ({pageNumber, source: {image: {src}}}: any) => {
            bus.dispatch("thumbnailRendered", pageNumber, src);
        })
    }

    {
        bus.subscribe("firstpage", () => {
            pdfjsEventBus.dispatch("firstpage");
        });
        bus.subscribe("lastpage", () => {
            pdfjsEventBus.dispatch("lastpage");
        })
    }



    // never send anymore
    // {
    //     pdfjsEventBus.on("__ready", () => {

    //         // send to reader.tsx ready to render pdf
    //         bus.dispatch("ready");


    //     });
    // }

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

    // spreadmode
    let colMode: IPdfPlayerColumn = defaultCol;
    let spreadModeEven: boolean = defaultSpreadModeEven;
    // const SpreadMode = {
    //   UNKNOWN: -1,
    //   NONE: 0, // Default value.
    //   ODD: 1,
    //   EVEN: 2,
    // };
    {
        bus.subscribe("column", (col) => {

            pdfjsEventBus.dispatch("switchspreadmode", { mode: col === "auto" ? 0 : col === "1" ? 0 : spreadModeEven ? 2 : 1 });
            bus.dispatch("column", col);
            colMode = col;
        });
    }
    {
        bus.subscribe("spreadModeEven", (v) => {

            pdfjsEventBus.dispatch("switchspreadmode", { mode: colMode === "auto" ? 0 : colMode === "1" ? 0 : v ? 2 : 1 });
            bus.dispatch("spreadModeEven", v);
            spreadModeEven = v;
        });
    }

    const p = new Promise<void>((resolve) => pdfjsEventBus.on("documentloaded", resolve));

    // pagechange
    {
        // PageNumber or PageLabel one based !! This is not pageIndex zero based
        bus.subscribe("pageLabel", (pageLabel: string) => {
            p.then(() => {
                pdfjsEventBus.dispatch("__setPageLabelOrPageNumber", pageLabel);

            });
        });
        bus.subscribe("pageNumber", (pageNumber: number) => {
            p.then(() => {
                pdfjsEventBus.dispatch("__setPageLabelOrPageNumber", pageNumber);

            });
        });
        // const debounceUpdateviewarea = debounce(async (evt: any) => {
        //     try {
        //         const { location: { pageNumber } } = evt;
        //         console.log("pageNumber", pageNumber);
        //         bus.dispatch("page", pageNumber);
        //     } catch (e) {
        //         console.log("updateviewarea ERROR", e);
        //     }
        // }, 500);
        // pdfjsEventBus.on("updateviewarea", async (evt: any) => {
        //     await debounceUpdateviewarea(evt);
        // });

        bus.subscribe("page-next", () => {
            if (colMode === "2") {
                pdfjsEventBus.dispatch("nextpage");
            }
            pdfjsEventBus.dispatch("nextpage");
        });
        bus.subscribe("page-previous", () => {
            if (colMode === "2") {
                pdfjsEventBus.dispatch("previouspage");
            }
            pdfjsEventBus.dispatch("previouspage");
        });

    }
    // view
    // let lockViewMode = false;
    {
        // bus.subscribe("view", (view) => {
        //     if (view === "paginated") {
        //         pdfjsEventBus.dispatch("scalechanged", { value: "page-fit" });
        //         bus.dispatch("scale", "page-fit");
        //         document.body.className = "hidescrollbar";
        //         lockViewMode = true;
        //     } else if (view === "scrolled") {
        //         document.body.className = "";
        //         lockViewMode = false;
        //     }
        //     bus.dispatch("view", view);
        // });
    }
    // scale
    {
        bus.subscribe("scale", (scale) => {
            // if (!lockViewMode) {

            pdfjsEventBus.dispatch("scalechanged", { value: typeof scale === "number" ? `${scale / 100}` : scale });
            bus.dispatch("scale", scale);
            // }
        });
        pdfjsEventBus.on("scalechanging", ({/*_scale, */ presetValue }: any) => bus.dispatch("scale", presetValue));
    }

    window.document.body.addEventListener("copy", (evt: ClipboardEvent) => {
        const selection = window.document.getSelection();
        if (selection) {
            const str = selection.toString();
            if (str) {
                evt.preventDefault();

                setTimeout(() => {
                    // https://github.com/mozilla/pdf.js/blob/aa4b9ffd4ac985230cbbfca329322fa578b630dd/web/text_layer_builder.js#L167-L176
                    const txt = removeNullCharacters(normalizeUnicode(str));

                    // if (txt !== str) {
                    //     console.log("PDF clipboard copy text normalize: ", str, " ===> ", txt);
                    // }
                    bus.dispatch("copy", txt);
                }, 500);
            }
        }
    }, true);

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
