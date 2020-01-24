// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { winActions } from "readium-desktop/main/redux/actions";
import { eventChannel } from "redux-saga";
import { all, put, take, takeLeading } from "redux-saga/effects";

function* libraryDidFinishLoad(action: winActions.session.registerLibrary.TAction) {

    const library = action.payload.win;
    const identifier = action.payload.identifier;
    const channel = eventChannel<void>(
        (emit) => {

            const handler = () => emit();
            library.webContents.on("did-finish-load", handler);

            return () => {
                library.webContents.removeListener("did-finish-load", handler);
            };
        },
    );

    yield take(channel);
    yield put(winActions.library.openSucess.build(library, identifier));
}

function* libraryClosed(action: winActions.session.registerLibrary.TAction) {

    const library = action.payload.win;
    const channel = eventChannel<void>(
        (emit) => {

            const handler = () => emit();
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

export function* watchers() {
    yield all([
        takeLeading(winActions.session.registerLibrary.ID, libraryDidFinishLoad),
        takeLeading(winActions.session.registerLibrary.ID, libraryClosed),
    ]);
}
