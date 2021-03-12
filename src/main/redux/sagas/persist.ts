// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { patchFilePath, stateFilePath } from "readium-desktop/main/di";
import { winActions } from "readium-desktop/main/redux/actions";
import { PersistRootState, RootState } from "readium-desktop/main/redux/states";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, debounce } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";
import { promises as fsp } from "fs";

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
    // const configRepository: ConfigRepository<Partial<RootState>> = diMainGet("config-repository");
    // await configRepository.save({
    // identifier: CONFIGREPOSITORY_REDUX_PERSISTENCE,
    const value: PersistRootState = {
        win: nextState.win,
        publication: nextState.publication,
        reader: nextState.reader,
        session: nextState.session,
        i18n: nextState.i18n,
    };
    // });

    await fsp.writeFile(stateFilePath, value, {encoding: "utf8"});
    debug("end of persist reduxState in disk");
};

export function* needToPersistFinalState() {

    const nextState = yield* selectTyped((store: RootState) => store);
    yield call(() => persistStateToFs(nextState));
}

export function* needToPersistPatch() {

    try {

        const patch = yield* selectTyped((store: RootState) => store.patch);
        yield call(() => fsp.writeFile(patchFilePath, JSON.stringify(patch), { encoding: "utf8" }));

    } catch (e) {
        debug("ERROR to persist patch state in the filesystem", e);
    }
}

export function saga() {
    return debounce(
        DEBOUNCE_TIME,
        winActions.persistRequest.ID,
        needToPersistPatch,
    );
}
