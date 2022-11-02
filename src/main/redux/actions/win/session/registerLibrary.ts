
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { ok } from "readium-desktop/common/utils/assert";
import { saveLibraryWindowInDi } from "readium-desktop/main/di";
import { v4 as uuidv4 } from "uuid";

export const ID = "WIN_SESSION_REGISTER_LIBRARY";

export interface Payload {
    win: BrowserWindow;
    identifier: string;
    winBound: Electron.Rectangle;
}

export function build(win: BrowserWindow, winBound: Electron.Rectangle):
    Action<typeof ID, Payload> {

    ok(win, "lib win not defined");
    saveLibraryWindowInDi(win);

    return {
        type: ID,
        payload: {
            win,
            winBound,
            identifier: uuidv4(),
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
