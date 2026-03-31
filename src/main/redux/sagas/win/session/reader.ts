// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { error } from "readium-desktop/main/tools/error";
import { winActions } from "readium-desktop/main/redux/actions";
import { eventChannel, Task, buffers } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { cancel, debounce, fork, put, take, call  } from "redux-saga/effects";
import { diMainGet } from "readium-desktop/main/di";
import { winClose } from "../reader";
import { closeProcessLock } from "readium-desktop/main/di";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:session:reader";
const debug = debug_(filename_);

function* readerClosureManagement(action: winActions.session.registerReader.TAction) {

    const moveOrResizeTask: Task = yield fork(readerMoveOrResizeObserver, action);

    const { readerWindow, windowIdentifier, publicationIdentifier } = action.payload;

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);
            readerWindow.on("close", handler);

            return () => {
                readerWindow.removeListener("close", handler);
            };
        },
        buffers.none(),
    );

    // waiting for reader window to close
    yield take(channel);

    // cancel moveAndResizeObserver
    yield cancel(moveOrResizeTask);

    debug("event close requested -> emit unregisterReader and closed");
    // yield put(winActions.reader.closed.build(windowIdentifier, publicationIdentifier));
    yield call(winClose, windowIdentifier, publicationIdentifier);

}

function* readerMoveOrResizeObserver(action: winActions.session.registerReader.TAction) {

    const reader = action.payload.readerWindow;
    const id = action.payload.windowIdentifier;
    const pubId = action.payload.publicationIdentifier;
    const DEBOUNCE_TIME = 1000;

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
        buffers.none(), // sliding(0) ?
    );

    yield debounce(DEBOUNCE_TIME, channel, function*() {

        if (closeProcessLock.isLock) {
            debug("CLOSE process reader bound not persisted");
            return ;
        }

        try {
            const winBound = reader.getBounds();
            debug("_______1 reader.getBounds()", winBound);
            // winBound = normalizeWinBoundRectangle(winBound);
            yield put(winActions.session.setBound.build(id, winBound));
            yield call(() => diMainGet("publication-data").writeJsonObj(pubId, "bound", winBound));
        } catch (e) {
            debug("set reader bound error", id, e);
        }
    }); 
}

export function saga() {
    return takeSpawnEvery(
        winActions.session.registerReader.ID,
        readerClosureManagement,
        (e) => error(filename_ + ":readerClosureManagement", e),
    );
}
