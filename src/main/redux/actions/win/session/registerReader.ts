// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow, Rectangle } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import {
    IReaderStateReader,
} from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as uuid from "uuid";

export const ID = "WIN_REGISTRY_REGISTER_READER";

export interface Payload {
    win: BrowserWindow;
    publicationIdentifier: string;
    identifier: string;
    winBound: Rectangle;
    filesystemPath: string;
    manifestUrl: string;
    reduxStateReader: IReaderStateReader;
}

export function build(
    win: BrowserWindow,
    publicationIdentifier: string,
    manifestUrl: string,
    filesystemPath: string,
    winBound: Rectangle,
    reduxStateReader?: IReaderStateReader,
    identifier: string = uuid.v4()):
    Action<typeof ID, Payload> {

    if (!reduxStateReader) {
        reduxStateReader = {
            config: readerConfigInitialState,
            info: {
                filesystemPath,
                manifestUrl,
                publicationIdentifier,
            },
        };
    } else {
        reduxStateReader = {
            ...reduxStateReader,
            ...{
                info: {
                    filesystemPath,
                    manifestUrl,
                    publicationIdentifier,
                },
            },
        };
    }

    return {
        type: ID,
        payload: {
            win,
            publicationIdentifier,
            manifestUrl,
            filesystemPath,
            winBound,
            identifier,
            reduxStateReader,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
