
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "MAIN_WIN_READER_OPEN_SUCCESS";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload {
    readerWindow: Electron.BrowserWindow;
    windowIdentifier: string;
    publicationIdentifier: string;
}

export function build(readerWindow: Electron.BrowserWindow, windowIdentifier: string, publicationIdentifier: string):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            readerWindow,
            windowIdentifier,
            publicationIdentifier,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
