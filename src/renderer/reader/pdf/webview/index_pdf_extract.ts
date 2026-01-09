// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld(
    "electronIpcRenderer",
    {
        send: function (name: string, data: any) {
            console.log("exposeInMainWorld electronIpcRenderer send", name, JSON.stringify(data, null, 4));

            if (name === "pdfjs-extract-data") {
                return ipcRenderer.send(name, data);
            }
            return undefined;
        },
    }
);
