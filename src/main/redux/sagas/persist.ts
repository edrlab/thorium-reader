// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import { diMainGet, patchFilePath, stateFilePath } from "readium-desktop/main/di";
import { RootState, PersistRootState } from "readium-desktop/main/redux/states";
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
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { IDictWinRegistryReaderState } from "../states/win/registry/reader";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";

const DEBOUNCE_TIME = 3 * 60 * 1000; // 3 min
const PUBLICATION_STORAGE_DEBOUNCE_TIME = 10 * 1000; // 10 secs

// Logger
const filename_ = "readium-desktop:main:saga:persist";
const debug = debug_(filename_);
debug("_");

const persistStateToFs = async (nextState: RootState) => {

    debug("start of persist reduxState in disk");

    let reader: IDictWinRegistryReaderState | undefined = undefined;
    if (nextState?.win?.registry?.reader) {
        reader = {};
        for (const pubId in nextState.win.registry.reader) {
            const _reader = nextState.win.registry.reader[pubId];
            const _readerReduxState = _reader.reduxState;
            reader[pubId] = {
                reduxState: {
                    // "config" | "locator" | "divina" | "disableRTLFlip" | "allowCustomConfig" | "noteTotalCount" | "pdfConfig"
                    config: _readerReduxState?.config,
                    locator: _readerReduxState?.locator,
                    divina: _readerReduxState?.divina,
                    disableRTLFlip: _readerReduxState?.disableRTLFlip,
                    allowCustomConfig: _readerReduxState?.allowCustomConfig,
                    noteTotalCount: _readerReduxState?.noteTotalCount,
                    pdfConfig: _readerReduxState?.pdfConfig,
                },
                windowBound: _reader.windowBound,
            };
        }
    }

    const value: PersistRootState & { __t: string, __v: string } = {
        theme: nextState.theme,
        win: {
            // disable session saving
            session: {
                library: undefined,
                reader: undefined,
            },
            registry: {
                reader,
            },
        },
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
        __t: (new Date()).toUTCString(),
        __v: _APP_VERSION,
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
            winActions.session.setBound.ID,
            function* (action: winActions.session.setBound.TAction) {
                const payload = action.payload;
                const identifier = payload.identifier;
                const boundJsonObj = payload.bound;

                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "bound", boundJsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.pdfConfig.ID,
            function* (action: readerActions.pdfConfig.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "pdfConfig", jsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.bookmarkTotalCount.ID,
            function* (action: readerActions.bookmarkTotalCount.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                // note and not bookmark !
                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "noteTotalCount", jsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.allowCustom.ID,
            function* (action: readerActions.allowCustom.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "allowCustomConfig", jsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.divina.setReadingMode.ID,
            function* (action: readerActions.divina.setReadingMode.TAction) {
                const divinaReadingMode = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "divina", divinaReadingMode));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.disableRTLFlip.ID,
            function* (action: readerActions.disableRTLFlip.TAction) {
                const rtlFlipJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "disableRTLFlip", rtlFlipJsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.setLocator.ID,
            function* (action: readerActions.setLocator.TAction) {
                const locatorJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "locator", locatorJsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.setConfig.ID,
            function* (action: readerActions.setConfig.TAction) {
                const configJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (!reader) {
                    debug("no reader sender found in session !!!");
                    return;
                }
                const pubId = reader.publicationIdentifier;

                const config: Partial<ReaderConfig> = (yield* callTyped(() => diMainGet("publication-data").getJsonObj(pubId, "config"))) || {};
                const configUnion = { ...config, ...configJsonObj };
                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "config", configUnion));
            },
            (e) => debug(e),
        ),
        debounce(
            PUBLICATION_STORAGE_DEBOUNCE_TIME,
            readerActions.pdfConfig.ID,
            function* (action: readerActions.pdfConfig.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (reader) {
                    const pubId = reader.publicationIdentifier;
                    yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "pdfConfig", jsonObj));
                }

            },
        ),
        debounce(
            PUBLICATION_STORAGE_DEBOUNCE_TIME,
            readerActions.bookmarkTotalCount.ID,
            function* (action: readerActions.bookmarkTotalCount.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (reader) {
                    const pubId = reader.publicationIdentifier;
                    yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "noteTotalCount", jsonObj));
                }

            },
        ),
        debounce(
            PUBLICATION_STORAGE_DEBOUNCE_TIME,
            readerActions.allowCustom.ID,
            function* (action: readerActions.allowCustom.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (reader) {
                    const pubId = reader.publicationIdentifier;
                    yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "allowCustomConfig", jsonObj));
                }

            },
        ),
        debounce(
            PUBLICATION_STORAGE_DEBOUNCE_TIME,
            readerActions.divina.setReadingMode.ID,
            function* (action: readerActions.divina.setReadingMode.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (reader) {
                    const pubId = reader.publicationIdentifier;
                    yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "divina", jsonObj));
                }

            },
        ),
        debounce(
            PUBLICATION_STORAGE_DEBOUNCE_TIME,
            readerActions.setLocator.ID,
            function* (action: readerActions.setLocator.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (reader) {
                    const pubId = reader.publicationIdentifier;
                    yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "locator", jsonObj));
                }

            },
        ),
        debounce(
            PUBLICATION_STORAGE_DEBOUNCE_TIME,
            readerActions.setConfig.ID,
            function* (action: readerActions.setConfig.TAction) {
                const configJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (reader) {
                    const pubId = reader.publicationIdentifier;
                    const config: Partial<ReaderConfig> = (yield* callTyped(() => diMainGet("publication-data").getJsonObj(pubId, "config"))) || {};
                    const configUnion = { ...config, ...configJsonObj };
                    yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "config", configUnion));
                }
            },
        ),
        debounce(
            PUBLICATION_STORAGE_DEBOUNCE_TIME,
            readerActions.disableRTLFlip.ID,
            function* (action: readerActions.disableRTLFlip.TAction) {
                const rtlFlipJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                if (reader) {
                    const pubId = reader.publicationIdentifier;
                    yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "disableRTLFlip", rtlFlipJsonObj));
                }
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
                    return;
                }
                const pubId = readers[identifier].publicationIdentifier;
                const readersPubId = Object.values(readers).filter((v) => v.publicationIdentifier === pubId);
                if (readersPubId.length > 1) {
                    return;
                }

                // TODO: parallelize with Promise.allSettled
                yield* callTyped(() => diMainGet("publication-data").close(pubId));

                {
                    const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "locator");
                    if (jsonObj) {
                        // finally save locator next to publication storage vault
                        yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "locator", jsonObj));
                    }
                }

                {
                    const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "config");
                    if (jsonObj) {
                        // finally save config next to publication storage vault
                        yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "config", jsonObj));
                    }
                }

                {
                    const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "disableRTLFlip");
                    if (jsonObj) {
                        // finally save disableRTLFlip next to publication storage vault
                        yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "disableRTLFlip", jsonObj));
                    }
                }
            },
// (e) => error(filename_ + ":winClose", e),
            (e) => debug(e),
        ),
    ]);
}
