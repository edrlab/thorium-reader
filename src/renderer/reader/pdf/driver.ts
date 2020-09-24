// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";

import { eventBus } from "./common/eventBus";
import { IEventBusPdfPlayer } from "./common/pdfReader.type";

// bridge between webview tx-rx communication and reader.tsx

export async function pdfMountWebview(
    pdfPath: string,
    publicationViewport: HTMLDivElement,
): Promise<[bus: IEventBusPdfPlayer, toc: Link[] | undefined]> {

    const webview = document.createElement("webview");
    webview.src = "";

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
