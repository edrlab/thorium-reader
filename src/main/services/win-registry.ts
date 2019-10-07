// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";
import { injectable } from "inversify";
import { AppWindow, AppWindowType } from "readium-desktop/common/models/win";
import { onWindowMoveResize } from "readium-desktop/common/rectangle/window";
import * as uuid from "uuid";

export interface WinDictionary {
    [winId: number]: AppWindow;
}

type OpenCallbackFunc = (appWindow: AppWindow) => void;
type CloseCallbackFunc = (appWindow: AppWindow) => void;

@injectable()
export class WinRegistry {
    // BrowserWindow.id => AppWindow
    private windows: WinDictionary;
    private openCallbacks: OpenCallbackFunc[];
    private closeCallbacks: CloseCallbackFunc[];

    constructor() {
        // No windows are registered
        this.windows = {};
        this.unregisterWindow = this.unregisterWindow.bind(this);
        this.openCallbacks = [];
        this.closeCallbacks = [];
    }

    public registerOpenCallback(callback: OpenCallbackFunc) {
        this.openCallbacks.push(callback);
    }

    public registerCloseCallback(callback: CloseCallbackFunc) {
        this.closeCallbacks.push(callback);
    }

    /**
     * Register new electron browser window
     *
     * @param win Electron BrowserWindows
     * @return Id of registered window
     */
    public registerWindow(win: BrowserWindow, type: AppWindowType): AppWindow {
        const winId = win.id;
        const appWindow: AppWindow = {
            identifier: uuid.v4(),
            type,
            win,
            onWindowMoveResize: onWindowMoveResize(win),
        };
        this.windows[winId] = appWindow;

        win.webContents.on("did-finish-load", () => {
            // Call callbacks
            for (const callback of this.openCallbacks) {
                callback(appWindow);
            }
        });

        // Unregister automatically
        win.on("closed", () => {
            this.unregisterWindow(winId);
        });

        return appWindow;
    }

    /**
     * Unregister electron browser window
     *
     * @param winId Id of registered window
     */
    public unregisterWindow(winId: number) {
        if (!(winId in this.windows)) {
            // Window not found
            return;
        }

        const appWindow = this.windows[winId];
        delete this.windows[winId];

        // Call callbacks
        for (const callback of this.closeCallbacks) {
            callback(appWindow);
        }
    }

    public getWindow(winId: number): AppWindow {
        if (!(winId in this.windows)) {
            // Window not found
            return undefined;
        }

        return this.windows[winId];
    }

    public getWindowByIdentifier(identifier: string): AppWindow {
        for (const appWindow of Object.values(this.windows)) {
            if (appWindow.identifier === identifier) {
                return appWindow;
            }
        }
        return null;
    }

    /** Returns all registered windows */
    public getWindows() {
        return this.windows;
    }
}
