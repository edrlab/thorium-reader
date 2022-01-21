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
