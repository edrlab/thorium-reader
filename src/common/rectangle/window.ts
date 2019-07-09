// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app, Rectangle, screen } from "electron";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const CONFIG_NAME = "windowRectangle.json";
const PATH = path.join(app.getPath("userData"), CONFIG_NAME);

export const savedWindowsRectangle = async (rectangle: Rectangle) => {
    try {
        await promisify(fs.writeFile)(PATH, JSON.stringify(rectangle));
    } catch (e) {
        console.error(e);
    }
};

export const getWindowsRectangle = async (): Promise<Rectangle> => {
    if (await promisify(fs.exists)(PATH)) {
        return JSON.parse(await promisify(fs.readFile)(PATH, { encoding: "utf8" }));
    }
    const c: Rectangle = {
        height: 600,
        width: 800,
        x: screen.getPrimaryDisplay().workAreaSize.width / 3,
        y: screen.getPrimaryDisplay().workAreaSize.height / 3,
    };
    savedWindowsRectangle(c);
    return c;
};
