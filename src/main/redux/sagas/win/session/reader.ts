// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { winActions } from "readium-desktop/main/redux/actions";
import { debounce } from "readium-desktop/utils/debounce";
import { eventChannel } from "redux-saga";
import { all, put, take, takeEvery } from "redux-saga/effects";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:session:reader");

function* readerClosed(action: winActions.session.registerReader.TAction) {

    const readerWindow = action.payload.win;
    const identifier = action.payload.identifier;
    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);
            readerWindow.on("close", handler);

            return () => {
                readerWindow.removeListener("close", handler);
            };
        },
    );

    yield take(channel);
    debug("event close requested -> emit unregisterReader and closed");
    yield put(winActions.reader.closed.build(identifier));
}

function* readerMovedOrResized(action: winActions.session.registerReader.TAction) {

    const reader = action.payload.win;
    const id = action.payload.identifier;

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            const DEBOUNCE_TIME = 500;

            const debounceHandler = debounce<typeof handler>(handler, DEBOUNCE_TIME);

            reader.on("move", debounceHandler);
            reader.on("resize", debounceHandler);

            return () => {
                reader.removeListener("move", debounceHandler);
                reader.removeListener("resize", debounceHandler);
            };
        },
    );

    while (42) {

        yield take(channel);

        const winBound = reader.getBounds();

        yield put(winActions.session.setBound.build(id, winBound));
    }
}

export function* watchers() {
    // need to fork on each registerReader action
    yield all([
        takeEvery(winActions.session.registerReader.ID, readerClosed),
        takeEvery(winActions.session.registerReader.ID, readerMovedOrResized),
    ]);
}
