// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { error } from "readium-desktop/common/error";
import { winActions } from "readium-desktop/main/redux/actions";
import { eventChannel } from "redux-saga";
import { all, debounce, put, take, takeEvery } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:session:reader";
const debug = debug_(filename_);

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
    const DEBOUNCE_TIME = 500;

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            reader.on("move", handler);
            reader.on("resize", handler);

            return () => {
                reader.removeListener("move", handler);
                reader.removeListener("resize", handler);
            };
        },
    );

    yield debounce(DEBOUNCE_TIME, channel, function*() {

        const winBound = reader.getBounds();
        yield put(winActions.session.setBound.build(id, winBound));
    });
}

export function* watchers() {

    try {
        // need to fork on each registerReader action
        yield all([
            takeEvery(winActions.session.registerReader.ID, readerClosed),
            takeEvery(winActions.session.registerReader.ID, readerMovedOrResized),
        ]);
    } catch (err) {
        error(filename_, err);
    }
}
