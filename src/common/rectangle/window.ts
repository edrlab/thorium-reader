// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { /*BrowserWindow,*/ Rectangle, screen, Display } from "electron";
import { WINDOW_DEFAULT_HEIGHT, WINDOW_DEFAULT_WIDTH, WINDOW_MIN_HEIGHT, WINDOW_MIN_WIDTH } from "../constant";

// import debug_ from "debug";
// // Logger
// const debug = debug_("readium-desktop:common:rectangle:window");

export const compareWindowBound = (a: Rectangle, b: Rectangle): boolean =>
    a.x === b.x && a.y === b.y && a.height === b.height && a.width === b.width;


function getDefaultDisplay(): Display {

    // https://github.com/microsoft/vscode/blob/509690479065730f9cdd62984046e39093ffcf76/src/vs/platform/windows/electron-main/windowsStateHandler.ts#L343
    let displayToUse: Display | undefined;
    const displays = screen.getAllDisplays();

    // Single Display
    if (displays.length === 1) {
        displayToUse = displays[0];
    }

    // Multi Display
    else {

        // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
        if (process.platform === "darwin") {
            const cursorPoint = screen.getCursorScreenPoint();
            displayToUse = screen.getDisplayNearestPoint(cursorPoint);
        }
        // fallback to primary display or first display
        if (!displayToUse) {
            displayToUse = screen.getPrimaryDisplay() || displays[0];
        }
    }

    return displayToUse;
}

export const defaultWinBoundRectangle = (display?: Display, winBound: Rectangle = { x: 0, y: 0, height: WINDOW_DEFAULT_HEIGHT, width: WINDOW_DEFAULT_WIDTH }): Rectangle => {
    let workArea: Rectangle;
    if (display) {
        workArea = getWorkingArea(display);
    } else {
        try {
            const display = getDefaultDisplay();
            workArea = getWorkingArea(display);
        } catch { 
            workArea = winBound;
        }
    }
    const height = Math.min(winBound.height, workArea.height);
    const width = Math.min(winBound.width, workArea.width);

    const x = Math.round(Math.max(workArea.x, workArea.x + (workArea.width / 2) - (width / 2)));
    const y = Math.round(Math.max(workArea.y, workArea.y + (workArea.height / 2) - (height / 2)));

    return {
        width,
        height,
        x,
        y,
    };
};

// https://github.com/microsoft/vscode/blob/509690479065730f9cdd62984046e39093ffcf76/src/vs/platform/windows/electron-main/windows.ts#L405
function getWorkingArea(display: Display): Rectangle | undefined {

    // Prefer the working area of the display to account for taskbars on the
    // desktop being positioned somewhere (https://github.com/microsoft/vscode/issues/50830).
    //
    // Linux X11 sessions sometimes report wrong display bounds, so we validate
    // the reported sizes are positive.
    if (display.workArea.width > 0 && display.workArea.height > 0) {
        return display.workArea;
    }

    if (display.bounds.width > 0 && display.bounds.height > 0) {
        return display.bounds;
    }

    return undefined;
}

// https://github.com/microsoft/vscode/blob/509690479065730f9cdd62984046e39093ffcf76/src/vs/platform/windows/electron-main/windows.ts#L384
export const validateWindowBoundOnDisplay = (winBound: Rectangle, displayWorkingArea: Rectangle): winBound is Rectangle => {

    return Boolean(
        displayWorkingArea &&											            // we have valid working area bounds
        winBound.x + winBound.width > displayWorkingArea.x &&					    // prevent window from falling out of the screen to the left
        winBound.y + winBound.height > displayWorkingArea.y &&				        // prevent window from falling out of the screen to the top
        winBound.x < displayWorkingArea.x + displayWorkingArea.width &&	            // prevent window from falling out of the screen to the right
        winBound.y < displayWorkingArea.y + displayWorkingArea.height,		        // prevent window from falling out of the screen to the bottom
    );
};

// export const winBoundIsFullyVisible = (winBound: Rectangle): boolean => {
//     const windowWithinBounds = (displayWorkingArea: Rectangle, windowBound: Rectangle): boolean => {
//         return !!displayWorkingArea && !!windowBound && (
//             windowBound.x >= displayWorkingArea.x &&
//             windowBound.y >= displayWorkingArea.y &&
//             windowBound.x + windowBound.width <= displayWorkingArea.x + displayWorkingArea.width &&
//             windowBound.y + windowBound.height <= displayWorkingArea.y + displayWorkingArea.height
//         );
//     };

//     const isVisible = screen.getAllDisplays().some((display) => {
//         const displayWorkingArea = getWorkingArea(display);
//         return windowWithinBounds(displayWorkingArea, winBound);
//     });

//     return isVisible;
// }


export const ensureWinBoundCanBeSeenInDisplayWorkingArea = (winBound: Rectangle, displayWorkingArea: Rectangle) => {

    // https://github.com/microsoft/vscode/blob/509690479065730f9cdd62984046e39093ffcf76/src/vs/platform/windows/electron-main/windows.ts#L283-L288
    // Single Monitor: be strict about x/y positioning
    // macOS & Linux: these OS seem to be pretty good in ensuring that a window is never outside of it's bounds.
    // Windows: it is possible to have a window with a size that makes it fall out of the window. our strategy
    //          is to try as much as possible to keep the window in the monitor bounds. we are not as strict as
    //          macOS and Linux and allow the window to exceed the monitor bounds as long as the window is still
    //          some pixels (128) visible on the screen for the user to drag it back.


    // prevent window from falling out of the screen to the right with
    // 128px margin by positioning the window to the far right edge of the screen
    winBound.x = Math.max(displayWorkingArea.x, Math.min(winBound.x, displayWorkingArea.x + displayWorkingArea.width - 128));

    // prevent window from falling out of the screen to the bottom with
    // 128px margin by positioning the window to the far right edge of the screen
    winBound.y = Math.max(displayWorkingArea.y, Math.min(winBound.y, displayWorkingArea.y + displayWorkingArea.height - 128));

    winBound.width = Math.min(winBound.width, displayWorkingArea.width);
    winBound.height = Math.min(winBound.height, displayWorkingArea.height);
};

export const normalizeWinBoundRectangle = (winBound: Rectangle): Rectangle => {

    if (!winBound) {
        return defaultWinBoundRectangle();
    }

    const winBoundCopy = {...winBound};

    if (!winBound.x || typeof winBound.x !== "number") {// NaN, undefined, null, zero (positive and negative numbers are truthy)
        winBoundCopy.x = 0;
    }
    if (!winBound.y || typeof winBound.y !== "number") {
        winBoundCopy.y = 0;
    }
    if (!winBound.height || typeof winBound.height !== "number" || winBound.height < WINDOW_MIN_HEIGHT) {
        winBoundCopy.height = WINDOW_MIN_HEIGHT;
    }
    if (!winBound.width || typeof winBound.width !== "number" || winBound.width < WINDOW_MIN_WIDTH) {
        winBoundCopy.width = WINDOW_MIN_WIDTH;
    }

    try {
        const displays = screen.getAllDisplays();

        // Single Display
        if (displays.length === 1) {
            const displayWorkingArea = getWorkingArea(displays[0]);
            ensureWinBoundCanBeSeenInDisplayWorkingArea(winBoundCopy, displayWorkingArea);
        } else {

            const display = screen.getDisplayMatching(winBoundCopy);
            const displayWorkingArea = getWorkingArea(display);
            if (!validateWindowBoundOnDisplay(winBoundCopy, displayWorkingArea)) {
                return defaultWinBoundRectangle(display, winBound);
            } else {
                ensureWinBoundCanBeSeenInDisplayWorkingArea(winBoundCopy, displayWorkingArea);
            }
        }
    } catch {
        // https://github.com/microsoft/vscode/blob/509690479065730f9cdd62984046e39093ffcf76/src/vs/platform/windows/electron-main/windows.ts#L369-L371
        // Electron has weird conditions under which it throws errors
        // e.g. https://github.com/microsoft/vscode/issues/100334 when
        // large numbers are passed in
        return defaultWinBoundRectangle(undefined, winBound);
    }

    return winBoundCopy;
};
