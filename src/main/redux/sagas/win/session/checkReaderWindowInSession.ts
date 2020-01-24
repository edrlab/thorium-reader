// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { readerActions } from "readium-desktop/common/redux/actions";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { IDictWinSessionReaderState } from "readium-desktop/main/redux/states/win/session/reader";
import { put } from "redux-saga/effects";

/**
 * On library open request action, dispatch the opening of all readers in session
 */
export function* checkReaderWindowInSession(_action: winActions.library.openRequest.TAction) {

    const readers: IDictWinSessionReaderState = yield selectTyped(
        (state: RootState) => state.win.session.reader,
    );

    for (const key in readers) {
        if (readers[key]) {
            yield put(readerActions.openRequest.build(readers[key].publicationIdentifier));
        }
    }
}
