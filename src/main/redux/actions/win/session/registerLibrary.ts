
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";
import { Action } from "readium-desktop/common/models/redux";

import * as uuid from "uuid";

export const ID = "WIN_SESSION_REGISTER_LIBRARY";

export interface Payload {
    win: BrowserWindow;
    identifier: string;
    winBound: Electron.Rectangle;
}

export function build(win: BrowserWindow, winBound: Electron.Rectangle):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            win,
            winBound,
            identifier: uuid.v4(),
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
