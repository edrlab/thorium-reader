// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { /*BrowserWindow,*/ Rectangle, screen } from "electron";

// import debug_ from "debug";
// // Logger
// const debug = debug_("readium-desktop:common:rectangle:window");

export const defaultRectangle = (): Rectangle => (
    {
        height: 768,
        width: 1024,
        x: Math.max(0, Math.round(screen.getPrimaryDisplay().workAreaSize.width / 2 - 1024 / 2)),
        y: Math.max(0, Math.round(screen.getPrimaryDisplay().workAreaSize.height / 2 - 768 / 2)),
    });

export const normalizeRectangle = (winBound: Rectangle): Rectangle => {

    if (!winBound) {
        return defaultRectangle();
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
