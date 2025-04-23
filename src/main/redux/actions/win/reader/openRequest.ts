// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Rectangle } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { IReaderStateReaderPersistence } from "readium-desktop/common/redux/states/renderer/readerRootState";

export const ID = "MAIN_WIN_READER_OPEN_REQUEST";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload {
    publicationIdentifier: string;
    identifier?: string;
    winBound: Rectangle;
    manifestUrl: string;
    reduxState: Partial<IReaderStateReaderPersistence>;
}

export function build(
    publicationIdentifier: string,
    manifestUrl: string,
    winBound: Rectangle | undefined,
    reduxState: Partial<IReaderStateReaderPersistence>,
    identifier?: string,
):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            publicationIdentifier,
            winBound,
            manifestUrl,
            identifier,
            reduxState,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
