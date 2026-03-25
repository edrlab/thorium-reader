// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { /*BrowserWindow,*/ Rectangle, screen } from "electron";
import { WINDOW_DEFAULT_HEIGHT, WINDOW_DEFAULT_WIDTH } from "../constant";

// import debug_ from "debug";
// // Logger
// const debug = debug_("readium-desktop:common:rectangle:window");

export const compareWindowBound = (a: Rectangle, b: Rectangle): boolean =>
    a.x === b.x && a.y === b.y && a.height === b.height && a.width === b.width;

export const defaultRectangle = (): Rectangle => {
    const screenHeight = screen.getPrimaryDisplay().workAreaSize.height;
    const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
    const windowHeight = Math.min(WINDOW_DEFAULT_HEIGHT, screenHeight);
    const windowWidth = Math.min(WINDOW_DEFAULT_WIDTH, screenWidth);
    
    return {
        height: windowHeight,
        width: windowWidth,
        y: Math.max(0, Math.round(screenHeight / 2 - windowHeight / 2)),
        x: Math.max(0, Math.round(screenWidth / 2 - windowWidth / 2)),
    };
};

export const windowIsFullyVisible = (winBound: Rectangle): boolean => {
    const windowWithinBounds = (containerBound: Rectangle, windowBound: Rectangle): boolean => {
        return !!containerBound && !!windowBound && (
            windowBound.x >= containerBound.x &&
            windowBound.y >= containerBound.y &&
            windowBound.x + windowBound.width <= containerBound.x + containerBound.width &&
            windowBound.y + windowBound.height <= containerBound.y + containerBound.height
        );
    };

    const isVisible = screen.getAllDisplays().some((display) => {
        return windowWithinBounds(display.workArea, winBound);
    });

    return isVisible;
};

export const normalizeWinBoundRectangle = (winBound: Rectangle): Rectangle => {

    if (!winBound) {
        return defaultRectangle();
    }

    const winBoundCopy = {...winBound};

    if (!winBound.x) {// NaN, undefined, null, zero (positive and negative numbers are truthy)
        winBoundCopy.x = 0;
    }
    if (!winBound.y) {
        winBoundCopy.y = 0;
    }
    if (!winBound.height) {
        winBoundCopy.height = defaultRectangle().height;
    }
    if (!winBound.width) {
        winBoundCopy.width = defaultRectangle().width;
    }

    if (windowIsFullyVisible(winBoundCopy)) {
        return winBoundCopy;
    }

    return defaultRectangle();
};
