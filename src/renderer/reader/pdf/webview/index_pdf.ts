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
