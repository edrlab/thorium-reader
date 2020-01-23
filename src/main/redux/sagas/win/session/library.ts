// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { selectTyped } from "readium-desktop/common/redux/typed-saga";
import { savedLibraryWindowInDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { all, call, takeEvery } from "redux-saga/effects";

function* libraryDidFinishLoad() {

    const library = getLibraryWindowFromDi();
    const channel = eventChannel(
        (emit) => {

            const handler = () => emit(END);
            library.webContents.on("did-finish-load", handler);

            return () => {
                library.webContents.removeListener("did-finish-load", handler);
            };
        },
    );

    yield take(channel);
    yield put(winActions.library.openSucess.build());
}

function* libraryClosed() {

    const library = getLibraryWindowFromDi();
    const channel = eventChannel(
        (emit) => {

            const handler = () => emit(END);
            library.on("closed", handler);

            return () => {
                library.removeListener("closed", handler);
            };
        },
    );

    yield take(channel);
    yield put(winActions.library.closed.build());
    yield put(winActions.session.unregisterLibrary.build());
}

function* channelWatcher() {
    yield all([
        takeLeading(winActions.session.registerLibrary.ID, libraryDidFinishLoad),
        takeLeading(winActions.session.registerLibrary.ID, libraryClosed),
    ]);
}
