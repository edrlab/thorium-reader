// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    READER_CLOSE,
    READER_INIT,
    READER_OPEN,
    ReaderAction,
} from "readium-desktop/renderer/actions/reader";

import { Publication } from "readium-desktop/common/models/publication";

// export enum ReaderStatus {
//     Closed,
//     Open,
// }

export interface ReaderState {
    // status: ReaderStatus;
    publication?: Publication;
    manifestUrl?: string;
}

const initialState: ReaderState = {
    // status: ReaderStatus.Closed,
    publication: undefined,
    manifestUrl: undefined,
};

export function readerReducer(
    state: ReaderState = initialState,
    action: ReaderAction,
    ): ReaderState {
    switch (action.type) {
        case READER_INIT:
            console.log("readerReducer INIT (RENDERER)");
            state.publication = action.publication;
            return state;
        case READER_OPEN:
            console.log("readerReducer OPEN (RENDERER)");
            // state.status = ReaderStatus.Open;
            state.publication = action.publication;
            state.manifestUrl = action.manifestUrl;
            return state;
        case READER_CLOSE:
            console.log("readerReducer CLOSE (RENDERER)");
            // state.status = ReaderStatus.Closed;
            state.publication = state.manifestUrl = undefined;
            return state;
        default:
            return state;
    }
}
