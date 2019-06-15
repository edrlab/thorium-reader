// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app, Rectangle, screen } from "electron";
import * as fs from "fs";
import * as path from "path";
import { readFile } from "readium-desktop/utils/readFileAsync";
import { writeFile } from "readium-desktop/utils/writeFileAsync";

const CONFIG_NAME = "windowRectangle.json";
const PATH = path.join(app.getPath("userData"), CONFIG_NAME);

const existAsync = (pa: string) =>
    new Promise<void>((resolve, reject) =>
        fs.exists(pa, (res) => res ? resolve() : reject()));

export const savedWindowsRectangle = async (rectangle: Rectangle) => {
    try {
        await writeFile(PATH, JSON.stringify(rectangle));
    } catch (e) {
        console.error(e);
    }
};

export const getWindowsRectangle = async (): Promise<Rectangle> => {
    try {
        await existAsync(PATH);
        return JSON.parse(await readFile(PATH));
    } catch (e) {
        const c: Rectangle = {
            height: 800,
            width: 600,
            x: screen.getPrimaryDisplay().workAreaSize.width / 3,
            y: screen.getPrimaryDisplay().workAreaSize.height / 3,
        };
        savedWindowsRectangle(c);
        return c;
    }
};
