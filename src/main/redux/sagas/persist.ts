// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import { patchFilePath, stateFilePath } from "readium-desktop/main/di";
import { PersistRootState, RootState } from "readium-desktop/main/redux/states";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, debounce } from "redux-saga/effects";
import { flush as flushTyped, select as selectTyped } from "typed-redux-saga/macro";
import { winActions } from "../actions";

import { patchChannel } from "./patch";

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
        opds: nextState.opds,
    };

    await fsp.writeFile(stateFilePath, JSON.stringify(value), {encoding: "utf8"});
    debug("end of persist reduxState in disk");
};

export function* needToPersistFinalState() {

    const nextState = yield* selectTyped((store: RootState) => store);
    yield call(() => persistStateToFs(nextState));
    yield call(() => needToPersistPatch());
}

export function* needToPersistPatch() {

    try {

        const ops = yield* flushTyped(patchChannel);

        let data = "";
        let i = 0;
        while (i < ops.length) {
            data += JSON.stringify(ops[i]) + ",\n";
            ++i;
        }

        debug(data);
        if (data) {
            debug("start of patch persistence");
            yield call(() => fsp.appendFile(patchFilePath, data, { encoding: "utf8" }));
            debug("end of patch persistence");
        }


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
