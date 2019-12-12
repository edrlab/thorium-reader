// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderMode } from "readium-desktop/common/models/reader";
import { readerActions } from "readium-desktop/common/redux/actions";
import { ReaderState } from "readium-desktop/renderer/redux/states/reader";

// TODO: centralize this code, currently duplicated
// see src/main/redux/reducers/reader.ts
const initialState: ReaderState = {
    reader: undefined,
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
        enableMathJax: false,
        pageMargins: undefined,
        wordSpacing: undefined,
        letterSpacing: undefined,
        paraSpacing: undefined,
        noFootnotes: undefined,
        darken: undefined,
    },
};

export function readerReducer(
    state: ReaderState = initialState,
    action: readerActions.closeSuccess.TAction |
        readerActions.openSuccess.TAction |
        readerActions.configSetSuccess.TAction |
        readerActions.detachModeSuccess.TAction,
): ReaderState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case readerActions.openSuccess.ID:
            newState.reader = action.payload.reader;
            return newState;
        case readerActions.closeSuccess.ID:
            delete newState.reader;
            return newState;
        case readerActions.detachModeSuccess.ID:
            newState.mode = action.payload.mode;
            return newState;
        case readerActions.configSetSuccess.ID:
            newState.config = action.payload.config;
            return newState;
        default:
            return state;
    }
}
