// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { winActions } from "readium-desktop/main/redux/actions";
import { eventChannel } from "redux-saga";
import { all, put, take, takeEvery } from "redux-saga/effects";

function* readerDidFinishLoad(action: winActions.session.registerReader.TAction) {

    const readerWindow = action.payload.win;
    const identifier = action.payload.identifier;
    const channel = eventChannel<void>(
        (emit) => {

            const handler = () => emit();
            readerWindow.webContents.on("did-finish-load", handler);

            return () => {
                readerWindow.webContents.removeListener("did-finish-load", handler);
            };
        },
    );

    yield take(channel);
    yield put(winActions.reader.openSucess.build(readerWindow, identifier));
}

function* readerClosed(action: winActions.session.registerReader.TAction) {

    const readerWindow = action.payload.win;
    const publicationIdentifier = action.payload.publicationIdentifier;
    const identifier = action.payload.identifier;
    const channel = eventChannel<void>(
        (emit) => {

            const handler = () => emit();
            readerWindow.on("closed", handler);

            return () => {
                readerWindow.removeListener("closed", handler);
            };
        },
    );

    yield take(channel);
    yield put(winActions.reader.closed.build(identifier));
    yield put(winActions.session.unregisterReader.build(publicationIdentifier));
}

export function* watchers() {
    // need to fork on each registerReader action
    yield all([
        takeEvery(winActions.session.registerReader.ID, readerDidFinishLoad),
        takeEvery(winActions.session.registerReader.ID, readerClosed),
    ]);
}
