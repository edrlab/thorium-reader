// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { screen } from "electron";
import * as ramda from "ramda";
import { callTyped, selectTyped } from "readium-desktop/common/redux/typed-saga";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { debounce } from "readium-desktop/utils/debounce";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
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

function* readerMovedOrResized(action: winActions.session.registerReader.TAction) {

    const reader = action.payload.win;
    const id = action.payload.identifier;

    const channel = eventChannel<void>(
        (emit) => {

            const handler = () => emit();

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

        const readers = yield* selectTyped((state: RootState) => state.win.session.reader);

        const displayArea = yield* callTyped(() => screen.getPrimaryDisplay().workAreaSize);

        let winBound: Electron.Rectangle;
        if (ObjectKeys(readers).length) {
            const winBoundArray = [];
            for (const key in readers) {
                if (readers[key]) {
                    const rectangle = readers[key].windowBound;

                    rectangle.x += 100;
                    rectangle.x %= displayArea.width - rectangle.width;
                    rectangle.y += 100;
                    rectangle.y %= displayArea.height - rectangle.height;

                    winBoundArray.push(rectangle);
                }
            }

            winBound = ramda.uniq(winBoundArray)[0];
        } else {
            winBound = reader.getBounds();
        }

        yield put(winActions.session.setBound.build(id, winBound));
    }
}

export function* watchers() {
    // need to fork on each registerReader action
    yield all([
        takeEvery(winActions.session.registerReader.ID, readerDidFinishLoad),
        takeEvery(winActions.session.registerReader.ID, readerClosed),
        takeEvery(winActions.session.registerReader.ID, readerMovedOrResized),
    ]);
}
