// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { CONFIGREPOSITORY_REDUX_PERSISTENCE, diMainGet } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, debounce } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";

const DEBOUNCE_TIME = 3 * 60 * 1000; // 3 min

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
            publication: {
                db: nextState.publication.db,
                indexer: null,
                lastReadingQueue: nextState.publication.lastReadingQueue,
            },
            reader: nextState.reader,
            session: nextState.session,
            i18n: nextState.i18n,
        },
    });

    // const path = "/home/pierre/state.json";
    // writeFileSync(path, Buffer.from(JSON.stringify(
        // nextState.publication,
    // )));
    debug("end of persist reduxState in disk");
};

export function* needToPersistState() {

    try {

        const nextState = yield* selectTyped((store: RootState) => store);
        yield call(() => persistStateToFs(nextState));
    } catch (e) {
        debug("error persist state in user filesystem", e);
    }
}

export function saga() {
    return debounce(
        DEBOUNCE_TIME,
        winActions.persistRequest.ID,
        needToPersistState,
    );
}
