// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderMode } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";
import { readerActions } from "readium-desktop/common/redux/actions";
import { ActionPayloadReaderMain } from "readium-desktop/common/redux/actions/reader";
import { ReaderState } from "readium-desktop/main/redux/states/reader";

const initialState: ReaderState = {
    readers: {},
    mode: ReaderMode.Attached,
    config: {
        align: "auto",
        colCount: "auto",
        dark: false,
        font: "DEFAULT",
        fontSize: "100%",
        invert: false,
        lineHeight: "1.5",
        night: false,
        paged: false,
        readiumcss: true,
        sepia: false,
    },
};

export function readerReducer(
    state: ReaderState = initialState,
    action: Action<string, ActionPayloadReaderMain> |
        ReturnType<typeof readerActions.detachModeSuccess.build> |
        ReturnType<typeof readerActions.configSetSuccess.build>,
): ReaderState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case readerActions.ActionType.OpenSuccess:
            const act1 = action as Action<string, ActionPayloadReaderMain>;
            newState.readers[act1.payload.reader.identifier] = act1.payload.reader;
            return newState;
        case readerActions.ActionType.CloseSuccess:
            const act2 = action as Action<string, ActionPayloadReaderMain>;
            delete newState.readers[act2.payload.reader.identifier];
            return newState;
        case readerActions.detachModeSuccess.ID:
            const act3 = action as ReturnType<typeof readerActions.detachModeSuccess.build>;
            newState.mode = act3.payload.mode;
            return newState;
        case readerActions.configSetSuccess.ID:
            const act4 = action as ReturnType<typeof readerActions.configSetSuccess.build>;
            newState.config = act4.payload.config;
            return newState;
        default:
            return state;
    }
}
