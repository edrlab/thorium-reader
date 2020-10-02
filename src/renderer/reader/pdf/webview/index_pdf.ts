// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { ipcRenderer } from "electron";
import { eventBus } from "../common/eventBus";
import { IEventBusPdfPlayer, IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView } from "../common/pdfReader.type";
import { pdfReaderMountingPoint } from "./pdfReader";

function main() {

    function keyDownUpEventHandler(ev: KeyboardEvent, keyDown: boolean) {
        const elementName = (ev.target && (ev.target as Element).nodeName) ?
            (ev.target as Element).nodeName : "";
        const elementAttributes: {[name: string]: string} = {};
        if (ev.target && (ev.target as Element).attributes) {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < (ev.target as Element).attributes.length; i++) {
                const attr = (ev.target as Element).attributes[i];
                elementAttributes[attr.name] = attr.value;
            }
        }
        const payload = { // : IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN, same as IEventPayload_R2_EVENT_WEBVIEW_KEYUP
            altKey: ev.altKey,
            code: ev.code,
            ctrlKey: ev.ctrlKey,
            elementAttributes,
            elementName,
            key: ev.key,
            metaKey: ev.metaKey,
            shiftKey: ev.shiftKey,
        };
        ipcRenderer.sendToHost(keyDown ? "R2_EVENT_WEBVIEW_KEYDOWN" : "R2_EVENT_WEBVIEW_KEYUP", payload);
    }
    window.document.addEventListener("keydown", (ev: KeyboardEvent) => {
        keyDownUpEventHandler(ev, true);
    }, {
        capture: true,
        once: false,
        passive: false,
    });
    window.document.addEventListener("keyup", (ev: KeyboardEvent) => {
        keyDownUpEventHandler(ev, false);
    }, {
        capture: true,
        once: false,
        passive: false,
    });

    window.document.body.addEventListener("copy", (evt: ClipboardEvent) => {
        if (true) { // isClipboardIntercept? (if publication is LCP)
            const selection = window.document.getSelection();
            if (selection) {
                const str = selection.toString();
                if (str) {
                    evt.preventDefault();

                    setTimeout(() => {
                        const payload = { // : IEventPayload_R2_EVENT_CLIPBOARD_COPY
                            // locator: ...
                            txt: str,
                        };
                        ipcRenderer.sendToHost("R2_EVENT_CLIPBOARD_COPY", payload);
                        // if (evt.clipboardData) {
                        //     evt.clipboardData.setData("text/plain", str);
                        // }
                    }, 500);
                }
            }
        }
    });

    window.document.documentElement.addEventListener("keydown", (_ev: KeyboardEvent) => {
        window.document.documentElement.classList.add("ROOT_CLASS_KEYBOARD_INTERACT");
    }, true);

    window.document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {
        window.document.documentElement.classList.remove("ROOT_CLASS_KEYBOARD_INTERACT");
    }, true);

    const rootElement = document.body;

    const bus: IEventBusPdfPlayer = eventBus(
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
                    // tslint:disable-next-line: max-line-length
                    console.log("ipcRenderer pdf-eventbus received", JSON.parse(message.key), JSON.parse(message.payload));
                } catch (e) {
                    console.log("ipcRenderer error to parse", e);
                }

                const key = typeof message?.key !== "undefined" ? JSON.parse(message.key) : undefined;
                const data = typeof message?.payload !== "undefined" ? JSON.parse(message.payload) : [];

                if (Array.isArray(data)) {
                    ev(key, ...data);
                }

            });
        },
    );

    bus.subscribe("start", async (pdfPath: string) => {

        console.log("bus.subscribe start pdfPath", pdfPath);

        const defaultView: IPdfPlayerView = "paginated";
        const defaultScale: IPdfPlayerScale = "fit";
        const defaultCol: IPdfPlayerColumn = "1";

        const toc = await pdfReaderMountingPoint(rootElement, pdfPath, bus, defaultView, defaultCol, defaultScale);

        bus.subscribe("ready", () => {

            bus.dispatch("scale", defaultScale);
            bus.dispatch("view", defaultView);
            bus.dispatch("column", defaultCol);
        });
        bus.dispatch("ready", toc);

    });

}

document.addEventListener("DOMContentLoaded", () => {
    main();
});
