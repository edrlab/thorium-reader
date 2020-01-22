// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IArrayReaderBrowserWindowState } from "readium-desktop/main/redux/states/win/reader";
import { readerActions } from "readium-desktop/common/redux/actions";

export function winReaderBrowserWindowReducer(
    state: IArrayReaderBrowserWindowState = {},
    action: readerActions.openRequest.TAction |
        readerActions.openSuccess.TAction |
        readerActions.openError.TAction
): IArrayReaderBrowserWindowState {

    switch (action.type) {
        case readerActions.openRequest.ID:

            return {
                ...state,
                ...{
                    []
                }
            }

        case readerActions.openSuccess.ID:


        case readerActions.openError.ID:


        default:
            return state;
    }
}

