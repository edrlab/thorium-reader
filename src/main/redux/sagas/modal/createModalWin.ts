// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow, globalShortcut } from "electron";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { getLibraryWindowFromDi } from "../../../di";

const filename_ = "readium-desktop:main/modal/createModalWin.ts";
const debug = debug_(filename_);

export function createOpdsAuthenticationModalWin(url: string): BrowserWindow | undefined {

    const libWin = tryCatchSync(() => getLibraryWindowFromDi(), filename_);
    if (!libWin) {
        debug("no lib win !!");
        return undefined;
    }

    const win = new BrowserWindow(
        {
            width: 800,
            height: 600,
            parent: libWin,
            modal: true,
            show: false,
        });

    const handler = () => win.close();
    globalShortcut.register("esc", handler);
    win.on("close", () => {
        globalShortcut.unregister("esc");
    });

    win.once("ready-to-show", () => {
        win.show();
    });

    // tslint:disable-next-line: no-floating-promises
    win.loadURL(url);

    return win;
}
