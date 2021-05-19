// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { normalizeRectangle } from "readium-desktop/common/rectangle/window";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { error } from "readium-desktop/main/error";
import { winActions } from "readium-desktop/main/redux/actions";
import { eventChannel, Task } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { cancel, debounce, fork, put, take } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:session:library";
const debug = debug_(filename_);
debug("_");

function* libraryClosureManagement(action: winActions.session.registerLibrary.TAction) {

    const moveOrResizeTask: Task = yield fork(libraryMoveOrResizeObserver, action);

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

    // waiting for library window to close
    yield take(channel);

    // cancel moveAndResizeObserver
    yield cancel(moveOrResizeTask);

    // dispatch closure action
    yield put(winActions.session.unregisterLibrary.build());
    yield put(winActions.library.closed.build());
}

function* libraryMoveOrResizeObserver(action: winActions.session.registerLibrary.TAction) {

    const library = action.payload.win;
    const id = action.payload.identifier;
    const DEBOUNCE_TIME = 500;

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            library.on("move", handler);
            library.on("resize", handler);

            return () => {
                library.removeListener("move", handler);
                library.removeListener("resize", handler);
            };
        },
    );

    yield debounce(DEBOUNCE_TIME, channel, function*() {

        try {
            const winBound = library.getBounds();
            debug("_______2 library.getBounds()", winBound);
            normalizeRectangle(winBound);
            yield put(winActions.session.setBound.build(id, winBound));
        } catch (e) {
            debug("set library bound error", e);
        }
    });
}

export function saga() {
    return takeSpawnLeading(
        winActions.session.registerLibrary.ID,
        libraryClosureManagement,
        (e) => error(filename_ + ":libraryClosureManagement", e),
    );
}
