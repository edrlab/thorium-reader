// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Rectangle } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";

export const ID = "WIN_REGISTRY_REGISTER_READER_PUBLICATION";

export interface Payload {
    publicationIdentifier: string;
    bound: Rectangle;
    reduxStateReader: IReaderStateReader;
}

export function build(publicationIdentifier: string, bound: Rectangle, reduxStateReader: IReaderStateReader):
    Action<typeof ID, Payload> {

    // https://github.com/edrlab/thorium-reader/issues/1444
    // TODO:
    // see initStore() in main/redux/store/memory.ts
    // !!
    delete reduxStateReader.highlight;
    // https://github.com/edrlab/thorium-reader/blob/fd9d82beb95d5d2ee4c927a2eed91ebf3ffa8424/src/main/redux/actions/win/session/registerReader.ts#L57
    delete reduxStateReader.info;

    return {
        type: ID,
        payload: {
            bound,
            publicationIdentifier,
            reduxStateReader,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
