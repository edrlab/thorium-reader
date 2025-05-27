// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Rectangle } from "electron";
import { Action } from "readium-desktop/common/models/redux";
import { IReaderStateReaderPersistence } from "readium-desktop/common/redux/states/renderer/readerRootState";

export const ID = "WIN_REGISTRY_REGISTER_READER_PUBLICATION";

export interface Payload {
    publicationIdentifier: string;
    bound: Rectangle;
    reduxStateReader: Partial<IReaderStateReaderPersistence>;
}

export function build(publicationIdentifier: string, bound: Rectangle, reduxStateReader: Partial<IReaderStateReaderPersistence>):
    Action<typeof ID, Payload> {

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
