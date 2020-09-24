// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { ipcRenderer } from "electron";
import { eventBus } from "../common/eventBus";
import { IEventBusPdfPlayer } from "../common/pdfReader.type";
import { pdfReaderMountingPoint } from "./pdfReader";

function main() {
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
            ipcRenderer.on("pdf-eventbus", (event, message) => {

                console.log("pdf-eventbus received", event, message);

                const key = typeof message?.key !== "undefined" ? JSON.parse(message.key) : undefined;
                const data = typeof message?.payload !== "undefined" ? JSON.parse(message.payload) : [];

                if (Array.isArray(data)) {
                    ev(key, ...data);
                }

            });
        },
    );

    bus.subscribe("start", async (pdfPath: string) => {

        const toc = await pdfReaderMountingPoint(rootElement, pdfPath, bus);

        bus.dispatch("ready", toc);

    });

}

main();
