// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow } from "electron";

import { IOnWindowMoveResize } from "../rectangle/window";
import { Identifiable } from "./identifiable";

export enum AppWindowType {
    Library = "library",
    Reader = "reader",
}

export interface AppWindow extends Identifiable {
    type: AppWindowType;
    win: BrowserWindow;
    onWindowMoveResize: IOnWindowMoveResize;
}
