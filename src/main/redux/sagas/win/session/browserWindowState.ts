// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow, Rectangle } from "electron";

export interface IBrowserWindowBoundWithState extends Rectangle {
    windowMaximized?: boolean;
}

export interface IBrowserWindowStateSnapshot {
    windowBound: Rectangle;
    windowMaximized?: boolean;
}

export const extractWindowMaximized = (winBound: unknown): boolean | undefined => {
    const maybeWindowMaximized = (winBound as Partial<IBrowserWindowBoundWithState> | undefined)?.windowMaximized;
    return typeof maybeWindowMaximized === "boolean" ? maybeWindowMaximized : undefined;
};

export const getBrowserWindowStateSnapshot = (win: BrowserWindow): IBrowserWindowStateSnapshot => {
    const windowMaximized = win.isMaximized();
    const windowBound = windowMaximized ? win.getNormalBounds() : win.getBounds();
    return {
        windowBound,
        windowMaximized,
    };
};

export const persistableWindowBound = (winBound: Rectangle, windowMaximized?: boolean): IBrowserWindowBoundWithState => ({
    ...winBound,
    ...(windowMaximized === undefined ? {} : { windowMaximized }),
});

export const restoreBrowserWindowState = (
    win: BrowserWindow,
    { windowBound, windowMaximized }: Partial<IBrowserWindowStateSnapshot>,
): void => {
    if (win.isMinimized()) {
        win.restore();
    }

    if (windowMaximized === false && win.isMaximized()) {
        win.unmaximize();
    }

    if (windowBound) {
        win.setBounds(windowBound);
    }

    if (windowMaximized) {
        win.maximize();
    }
};
