// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow, Rectangle, screen } from "electron";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { container } from "readium-desktop/main/di";
import { WinRegistry } from "readium-desktop/main/services/win-registry";
import { debounce } from "readium-desktop/utils/debounce";
import { AppWindow, AppWindowType } from "../models/win";

import { ConfigDocument } from "readium-desktop/main/db/document/config";

// Logger
const debug = debug_("readium-desktop:common:rectangle:window");

const configIdKey = "windowRectangle";
const defaultRectangle = (): Rectangle => (
    {
        height: 600,
        width: 800,
        x: screen.getPrimaryDisplay().workAreaSize.width / 3,
        y: screen.getPrimaryDisplay().workAreaSize.height / 3,
    });

export type t_savedWindowsRectangle = typeof savedWindowsRectangle;
export const savedWindowsRectangle = async (rectangle: Rectangle) => {
    try {
        const configRepository: ConfigRepository = container.get("config-repository") as ConfigRepository;
        await configRepository.save({
            identifier: configIdKey,
            value: rectangle,
        });
        debug("new window rectangle position :", rectangle);
    } catch (e) {
        debug("save error", e);
    }
    return rectangle;
};
const debounceSavedWindowsRectangle = debounce<t_savedWindowsRectangle>(savedWindowsRectangle, 500);

export const getWindowsRectangle = async (WinType?: AppWindowType): Promise<Rectangle> => {

    try {
        const winRegistry = container.get("win-registry") as WinRegistry;
        const windows = Object.values(winRegistry.getWindows()) as AppWindow[];
        const displayArea = screen.getPrimaryDisplay().workAreaSize;
        if (WinType !== AppWindowType.Library && windows.length > 1) {
            const rectangle = windows.pop().win.getBounds();
            rectangle.x += 100;
            rectangle.x %= displayArea.width - rectangle.width;
            rectangle.y += 100;
            rectangle.y %= displayArea.height - rectangle.height;
            return rectangle;
        } else {
            const configRepository: ConfigRepository = container.get("config-repository") as ConfigRepository;
            let rectangle: ConfigDocument | undefined;
            try {
                rectangle = await configRepository.get(configIdKey);
            } catch (err) {
                // ignore
            }
            if (rectangle && rectangle.value) {
                debug("get window rectangle position from db :", rectangle.value);
                return rectangle.value;
            }
        }
    } catch (e) {
        debug("get error", e);
    }

    debug("default window rectangle");
    return defaultRectangle();
};

export interface IOnWindowMoveResize {
    attach: () => void;
    detach: () => void;
}

// handler to attach and detach move/resize event to win
export const onWindowMoveResize = (win: BrowserWindow): IOnWindowMoveResize => {
    const handler = () => {
        debounceSavedWindowsRectangle(win.getBounds());
    };

    return {
        attach: () => {
            win.on("move", handler);
            win.on("resize", handler);
        },
        detach: () => {
            win.removeListener("move", handler);
            win.removeListener("resize", handler);
        },
    };
};
