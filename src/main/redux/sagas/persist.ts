// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import { diMainGet, patchFilePath, stateFilePath } from "readium-desktop/main/di";
import { PersistRootState, RootState } from "readium-desktop/main/redux/states";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, debounce, all } from "redux-saga/effects";
import { flush as flushTyped, select as selectTyped, call as callTyped } from "typed-redux-saga/macro";
import { winActions } from "../actions";

import { patchChannel } from "./patch";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { readerActions } from "readium-desktop/common/redux/actions";
import { EventPayload } from "readium-desktop/common/ipc/sync";
import { SenderType } from "readium-desktop/common/models/sync";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";

const DEBOUNCE_TIME = 3 * 60 * 1000; // 3 min
const LOCATOR_DEBOUNCE_TIME = 10 * 1000; // 10 secs

// Logger
const filename_ = "readium-desktop:main:saga:persist";
const debug = debug_(filename_);
debug("_");

const persistStateToFs = async (nextState: RootState) => {

    // currently saved in one json file.
    // may be consuming a lot of I/O
    // rather need to save by chunck of data in many json file

    debug("start of persist reduxState in disk");

    const value: PersistRootState = {
        theme: nextState.theme,
        win: nextState.win,
        publication: nextState.publication,
        reader: nextState.reader,
        session: nextState.session,
        screenReader: nextState.screenReader,
        i18n: nextState.i18n,
        opds: nextState.opds,
        version: nextState.version,
        wizard: nextState.wizard,
        settings: nextState.settings,
        creator: nextState.creator,
        noteExport: nextState.noteExport,
        customization: {
            provision: [],
            lock: undefined,
            history: nextState.customization.history,
            activate: nextState.customization.activate,
            welcomeScreen: undefined,
            manifest: undefined,
        },
    };

    await fs.promises.writeFile(stateFilePath, JSON.stringify(value), {encoding: "utf8"});
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
            yield call(() => fs.promises.appendFile(patchFilePath, data, { encoding: "utf8" }));
            debug("end of patch persistence");
        }


    } catch (e) {
        debug("ERROR to persist patch state in the filesystem", e);
    }

}

export function saga() {
    return all([
        debounce(
            DEBOUNCE_TIME,
            winActions.persistRequest.ID,
            needToPersistPatch,
        ),
        takeSpawnLeading(
            readerActions.setLocator.ID,
            function* (action: readerActions.setLocator.TAction) {
                const locator = action.payload;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                const pubId = reader.publicationIdentifier;
                
                const locatorSerialize = (__TH__IS_DEV__ || __TH__IS_CI__) ? JSON.stringify(locator, null, 4) : JSON.stringify(locator);
                yield* callTyped(() => diMainGet("publication-data").write(pubId, "locator", locatorSerialize));
            },
            (e) => debug(e),
        ),
        debounce(
            LOCATOR_DEBOUNCE_TIME,
            readerActions.setLocator.ID,
            function* (action: readerActions.setLocator.TAction) {

                const locator = action.payload;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                const pubId = reader.publicationIdentifier;

                const locatorSerialize = (__TH__IS_DEV__ || __TH__IS_CI__) ? JSON.stringify(locator, null, 4) : JSON.stringify(locator);
                yield* callTyped(() => diMainGet("publication-storage").writeData(pubId, "locator", locatorSerialize));
            },
        ),
        // takeSpawnEvery(
        //     winActions.reader.openRequest.ID,
        //     function* (action: winActions.reader.openRequest.TAction) {
        //         const { publicationIdentifier: pubId } = action.payload;

        //         // not needed // read/write lazy open
        //         // yield* callTyped(() => diMainGet("publication-data").open(pubId, "locator"));

        //     },
        //     // (e) => error(filename_ + ":createReaderWindow", e),
        //     (e) => debug(e),
        // ),
        // takeSpawnEvery(
        //     winActions.reader.openSucess.ID,
        //     winOpen,
        //     (e) => error(filename_ + ":winOpen", e),
        // ),
        takeSpawnEvery(
            winActions.reader.closed.ID,
            function* (action: winActions.reader.closed.TAction) {
                const { identifier } = action.payload;

                const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
                if (!readers[identifier]) {
                    debug("ERROR NO READER BUT CLOSE ACTION RECEIVED (race condition!?)");
                    return ;
                }
                const pubId = readers[identifier].publicationIdentifier;
                const readersPubId = Object.values(readers).filter((v) => v.publicationIdentifier === pubId);
                if (readersPubId.length > 1) {
                    return ;
                }

                const data = diMainGet("publication-data").getDataRead(pubId, "locator");
                yield* callTyped(() => diMainGet("publication-data").close(pubId));

                if (data) {
                    // finally save locator next to publication storage vault
                    yield* callTyped(() => diMainGet("publication-storage").writeData(pubId, "locator", data));
                }

            },
            // (e) => error(filename_ + ":winClose", e),
            (e) => debug(e),
        ),
    ]);
}
