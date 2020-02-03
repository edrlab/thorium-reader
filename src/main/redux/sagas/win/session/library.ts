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
import { all, put, take, takeLeading } from "redux-saga/effects";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:library");
debug("_");

function* libraryClosed(action: winActions.session.registerLibrary.TAction) {

    const library = action.payload.win;
    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = (event: Electron.Event) => {
                event.preventDefault();
                emit(true);
            };
            library.on("close", handler);

            return () => {
                library.removeListener("close", handler);
            };
        },
    );

    yield take(channel);
    yield put(winActions.session.unregisterLibrary.build());
    yield put(winActions.library.closed.build());
}

function* libraryMovedOrResized(action: winActions.session.registerLibrary.TAction) {

    const library = action.payload.win;
    const id = action.payload.identifier;

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            const DEBOUNCE_TIME = 500;

            const debounceHandler = debounce<typeof handler>(handler, DEBOUNCE_TIME);

            library.on("move", debounceHandler);
            library.on("resize", debounceHandler);

            return () => {
                library.removeListener("move", debounceHandler);
                library.removeListener("resize", debounceHandler);
            };
        },
    );

    while (42) {

        yield take(channel);

        yield put(winActions.session.setBound.build(id, library.getBounds()));
    }
}

export function* watchers() {
    yield all([
        takeLeading(winActions.session.registerLibrary.ID, libraryClosed),
        takeLeading(winActions.session.registerLibrary.ID, libraryMovedOrResized),
    ]);
}
