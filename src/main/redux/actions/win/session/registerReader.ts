// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow, Rectangle } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { defaultRectangle } from "readium-desktop/common/rectangle/window";
import * as uuid from "uuid";

export const ID = "WIN_REGISTRY_REGISTER_READER";

export interface Payload {
    win: BrowserWindow;
    publicationIdentifier: string;
    identifier: string;
    winBound: Rectangle;
    fileSystemPath: string;
    manifestUrl: string;
    reduxState: any;
}

export function build(
    win: BrowserWindow,
    publicationIdentifier: string,
    manifestUrl: string,
    fileSystemPath: string,
    winBound: Rectangle = defaultRectangle(),
    reduxState: any = {},
    identifier: string = uuid.v4()):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            win,
            publicationIdentifier,
            manifestUrl,
            fileSystemPath,
            winBound,
            identifier,
            reduxState,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
