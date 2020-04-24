// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { callTyped, selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { CONFIGREPOSITORY_REDUX_PERSISTENCE, diMainGet } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { eventChannel, Task } from "redux-saga";
import { call, cancel, debounce, spawn, take } from "redux-saga/effects";

const DEBOUNCE_TIME = 1000;

// Logger
const filename_ = "readium-desktop:main:saga:persist";
const debug = debug_(filename_);
debug("_");

const persistStateToFs = async (nextState: RootState) => {

    // currently saved with pouchDb in one json file.
    // may be consuming a lot of I/O
    // rather need to save by chunck of data in many json file

    debug("start of persist reduxState in disk");
    const configRepository: ConfigRepository<Partial<RootState>> = diMainGet("config-repository");
    await configRepository.save({
        identifier: CONFIGREPOSITORY_REDUX_PERSISTENCE,
        value: {
            win: nextState.win,
            publication: nextState.publication,
            reader: nextState.reader,
        },
    });
    debug("end of persist reduxState in disk");
};

function getWindowAllClosedEventChannel() {

    const channel = eventChannel<boolean>(
        (emit) => {

            const handler = () => emit(true);

            app.on("window-all-closed", handler);

            return () => {
                app.removeListener("window-all-closed", handler);
            };
        },
    );

    return channel;
}

function* needToPersistState() {

    try {

        const nextState = yield* selectTyped((store: RootState) => store);
        yield call(() => persistStateToFs(nextState));
    } catch (e) {
        debug("error persist state in user filesystem", e);
    }
}

function* windowaAllClosedEventManager() {

    const allClosedEventChannel = yield* callTyped(getWindowAllClosedEventChannel);

    const debounceTask: Task = yield debounce(
        DEBOUNCE_TIME,
        winActions.persistRequest.ID,
        needToPersistState,
    );

    // wait untill all windows are closed to continue
    yield take(allClosedEventChannel);

    // cancel persistence
    yield cancel(debounceTask);

    // persist the winState now and exit 0 the app
    yield call(needToPersistState);

    yield call(() => app.exit(0));
}

export function saga() {
    return spawn(windowaAllClosedEventManager);
}
