// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderMode } from "readium-desktop/common/models/reader";
import { readerActions } from "readium-desktop/common/redux/actions";

const initialState: ReaderMode = ReaderMode.Attached;

export function winModeReducer(
    state: ReaderMode = initialState,
    action: readerActions.detachModeRequest.TAction |
        readerActions.attachModeRequest.TAction,
): ReaderMode {
    switch (action.type) {

        case readerActions.detachModeRequest.ID:
            return ReaderMode.Detached;

        case readerActions.attachModeRequest.ID:
            return ReaderMode.Attached;

        default:
            return state;
    }
}
