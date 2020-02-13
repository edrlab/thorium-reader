// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import { error } from "readium-desktop/common/error";
import { callTyped, selectTyped } from "readium-desktop/common/redux/typed-saga";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { CONFIGREPOSITORY_REDUX_PERSISTENCE, diMainGet } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { eventChannel } from "redux-saga";
import { cancel, debounce, take } from "redux-saga/effects";

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
        },
    });
    debug("end of persist reduxState in disk");
};

function* needToPersistState() {

    const nextState = yield* selectTyped<(store: RootState) => RootState>((store) => store);
    yield* callTyped(() => persistStateToFs(nextState));
}

function* windowAllClosedEventChannel() {

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

export function* watchers() {

    try {

        const debounceTask = yield debounce(DEBOUNCE_TIME, winActions.persistRequest.ID, needToPersistState);

        // wait untill all windows are closed to continue
        const channel = yield* callTyped(windowAllClosedEventChannel);
        yield take(channel);

        yield cancel(debounceTask);

        // persist the winState now and exit 0 the app
        const nextState = yield* selectTyped<(store: RootState) => RootState>((store) => store);
        yield* callTyped(() => persistStateToFs(nextState));

        yield* callTyped(() => app.exit(0));

    } catch (err) {
        error(filename_, err);
    }
}
