// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";
import { injectable } from "inversify";
import * as uuid from "uuid";

export interface WinDictionary {
    [winId: string]: BrowserWindow;
}

@injectable()
export class WinRegistry {
    private windows: WinDictionary;

    constructor() {
        // No windows are registered
        this.windows = {};
    }

    /**
     * Register new electron browser window
     *
     * @param win Electron BrowserWindows
     * @return Id of registered window
     */
    public registerWindow(win: BrowserWindow): string {
        const winId = uuid.v4();
        this.windows[winId] = win;
        return winId;
    }

    /**
     * Unregister electron browser window
     *
     * @param winId Id of registered window
     */
    public unregisterWindow(winId: string) {
        if (this.windows.hasOwnProperty(winId)) {
            // Window not found
            return;
        }

        delete this.windows[winId];
    }

    /** Returns all registered windows */
    public getWindows() {
        return this.windows;
    }
}
