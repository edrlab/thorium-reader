// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { /*BrowserWindow,*/ Rectangle, screen } from "electron";

// import * as debug_ from "debug";
// // Logger
// const debug = debug_("readium-desktop:common:rectangle:window");

export const defaultRectangle = (): Rectangle => (
    {
        height: 600,
        width: 800,
        x: Math.round(screen.getPrimaryDisplay().workAreaSize.width / 3),
        y: Math.round(screen.getPrimaryDisplay().workAreaSize.height / 3),
    });

export const normalizeRectangle = (winBound: Rectangle): Rectangle | undefined => {

    // TS strictNullChecks would flag this incoherent check ...
    // ... but the "window bounds" code has been brittle so let's err on the side of caution
    if (!winBound) {
        return undefined;
    }

    const normalizeBound = { ...winBound };

    const windowWithinBounds = (bounds: Rectangle, state: Rectangle): boolean => {
        return !!bounds && !!state && (
            state.x >= bounds.x &&
            state.y >= bounds.y &&
            state.x + state.width <= bounds.x + bounds.width &&
            state.y + state.height <= bounds.y + bounds.height
        );
    };

    const visible = screen.getAllDisplays().some((display) => {
        return windowWithinBounds(display.workArea, normalizeBound);
    });

    if (visible) {
        return normalizeBound;
    }
    return defaultRectangle();
};

// export type t_savedWindowsRectangle = typeof savedWindowsRectangle;
// export const savedWindowsRectangle = async (rectangle: Rectangle) => {
//     try {
//         const configRepository: ConfigRepository<Rectangle> = diMainGet("config-repository");
//         await configRepository.save({
//             identifier: WINDOW_RECT_CONFIG_ID,
//             value: rectangle,
//         });
//         debug("new window rectangle position :", rectangle);
//     } catch (e) {
//         debug("save error", e);
//     }
//     return rectangle;
// };
// const debounceSavedWindowsRectangle = debounce<t_savedWindowsRectangle>(savedWindowsRectangle, 500);

// export const getWindowBounds = async (winType?: AppWindowType): Promise<Rectangle> => {

//     try {
//         const winRegistry = diMainGet("win-registry");
//         const readerWindows = winRegistry.getReaderWindows();

//         const displayArea = screen.getPrimaryDisplay().workAreaSize;

//         if (winType !== AppWindowType.Library && // is reader window
//             readerWindows.length > 0) { // there are already reader windows

//             // readerWindows is ordered by creation/registration time
//             // so we take the latest reader window and offset the new one
//             const rectangle = readerWindows[readerWindows.length - 1].browserWindow.getBounds();
//             rectangle.x += 100;
//             rectangle.x %= displayArea.width - rectangle.width;
//             rectangle.y += 100;
//             rectangle.y %= displayArea.height - rectangle.height;
//             return rectangle;

//         } else { // winType === AppWindowType.Library || readerWindows.length == 0

//             const configRepository: ConfigRepository<Rectangle> = diMainGet("config-repository");
//             let rectangle: ConfigDocument<Rectangle> | undefined;
//             try {
//                 rectangle = await configRepository.get(WINDOW_RECT_CONFIG_ID);
//             } catch (err) {
//                 // ignore
//             }
//             if (rectangle && rectangle.value) {
//                 debug("get window rectangle position from db :", rectangle.value);
//                 return rectangle.value;
//             }
//         }
//     } catch (e) {
//         debug("get error", e);
//     }

//     debug("default window rectangle");
//     return defaultRectangle();
// };

// export interface IOnWindowMoveResize {
//     attach: () => void;
//     detach: () => void;
// }

// // handler to attach and detach move/resize event to win
// export const onWindowMoveResize = (win: BrowserWindow): IOnWindowMoveResize => {
//     const handler = () => {
//         debounceSavedWindowsRectangle(win.getBounds());
//     };

//     return {
//         attach: () => {
//             win.on("move", handler);
//             win.on("resize", handler);
//         },
//         detach: () => {
//             win.removeListener("move", handler);
//             win.removeListener("resize", handler);
//         },
//     };
// };
