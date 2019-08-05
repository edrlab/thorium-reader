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

export const getWindowsRectangle = async (): Promise<Rectangle> => {

    try {
        const winRegistry = container.get("win-registry") as WinRegistry;
        const windows = Object.values(winRegistry.getWindows()) as AppWindow[];
        if (windows.filter((win) => win.type === AppWindowType.Reader).length) {
            const rectangle = windows.pop().win.getBounds();
            rectangle.x += 100;
            rectangle.x %= screen.getPrimaryDisplay().workAreaSize.width;
            rectangle.y += 100;
            rectangle.y %= screen.getPrimaryDisplay().workAreaSize.height;
            return rectangle;
        } else {
            const configRepository: ConfigRepository = container.get("config-repository") as ConfigRepository;
            const rectangle = await configRepository.get(configIdKey);
            if (rectangle && rectangle.value) {
                debug("get window rectangle position from db :", rectangle.value);
                return rectangle.value;
            }
            return await savedWindowsRectangle(defaultRectangle());
        }
    } catch (e) {
        debug("get error", e);
        return defaultRectangle();
    }
};
