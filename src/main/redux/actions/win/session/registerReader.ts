// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { BrowserWindow, Rectangle } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { locatorInitialState } from "readium-desktop/common/redux/states/locatorInitialState";
import { IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { v4 as uuidv4 } from "uuid";

import {
    convertHttpUrlToCustomScheme, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";

export const ID = "WIN_SESSION_REGISTER_READER";

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
    publicationView: PublicationView,
    manifestUrl: string,
    filesystemPath: string,
    winBound: Rectangle,
    reduxStateReader?: IReaderStateReader,
    identifier: string = uuidv4()):
    Action<typeof ID, Payload> {

    // we lose purity !!
    const store = diMainGet("store");

    const disableRTLFlip = store.getState().reader.disableRTLFlip;

    const manifestUrlR2Protocol = manifestUrl.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL)
        ? manifestUrl : convertHttpUrlToCustomScheme(manifestUrl);

    reduxStateReader = {
        ...{
            // see issue https://github.com/edrlab/thorium-reader/issues/2532
            config: readerConfigInitialState,
            disableRTLFlip,
            locator: locatorInitialState,
        },
        ...reduxStateReader,
        ...{
            info: {
                filesystemPath,
                manifestUrlHttp: manifestUrl,
                manifestUrlR2Protocol,
                publicationIdentifier,
                r2Publication: undefined,
                publicationView,
                navigator: undefined,
            },
        },
    };

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
