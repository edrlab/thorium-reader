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
import { debounce } from "readium-desktop/utils/debounce";

// Logger
const debug = debug_("readium-desktop:common:rectangle");

const configIdKey = "rectangle";
const defaultRectangle = (): Rectangle => (
    {
        height: 600,
        width: 800,
        x: screen.getPrimaryDisplay().workAreaSize.width / 3,
        y: screen.getPrimaryDisplay().workAreaSize.height / 3,
    });

type t_savedWindowsRectangle = typeof savedWindowsRectangle;
export const savedWindowsRectangle = async (rectangle: Rectangle) => {
    try {
        const configRepository: ConfigRepository = container.get("config-repository") as ConfigRepository;
        configRepository.save({
            identifier: configIdKey,
            value: rectangle,
        });
        debug("new windows rectangle position :", rectangle);
    } catch (e) {
        debug("save error", e);
    }
    return rectangle;
};

export const getWindowsRectangle = async (): Promise<Rectangle> => {
    try {
        const configRepository: ConfigRepository = container.get("config-repository") as ConfigRepository;
        const rectangle = await configRepository.get(configIdKey);
        if (rectangle && rectangle.value) {
            return rectangle.value;
        }
        return await savedWindowsRectangle(defaultRectangle());
    } catch (e) {
        debug("get error", e);
        return defaultRectangle();
    }
};

export const initRectangleWatcher = (win: BrowserWindow) => {
    const debounceSavedWindowsRectangle =
        debounce<t_savedWindowsRectangle>(savedWindowsRectangle, 500);
    win.on("move", () =>
        debounceSavedWindowsRectangle(win.getBounds()));
    win.on("resize", () =>
        debounceSavedWindowsRectangle(win.getBounds()));
};
