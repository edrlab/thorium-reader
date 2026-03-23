// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import { diMainGet, patchFilePath, runtimeStateFilePath, state_V340_FilePath, stateFilePath } from "readium-desktop/main/di";
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
import { IWinSessionLibraryState } from "../states/win/session/library";
import { JsonStringifySortedKeys } from "readium-desktop/common/utils/json";
import { rmrf } from "readium-desktop/utils/fs";

const DEBOUNCE_TIME = 3 * 60 * 1000; // 3 min
const PUBLICATION_STORAGE_DEBOUNCE_TIME = 10 * 1000; // 10 secs

// Logger
const filename_ = "readium-desktop:main:saga:persist";
const debug = debug_(filename_);
debug("_");
 


export const persistStateToFs = async (nextState: Partial<PersistRootState>) => {

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
                library: {
                    windowBound: nextState?.win?.session?.library?.windowBound,
                } as unknown as IWinSessionLibraryState,
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

    const oldStateDataStringified = JsonStringifySortedKeys(value);

    // remove the registry.reader key
    // in case of crash, the N-1 state_v340.json will not contain any publication reader data, hydration will come from publication-data json chunk file.
    // This is part of the migration from an unique central json state with WAL as diff patch TO multiple chunks of json data on filesystem colocalised to the publication itself
    delete value.win.registry;
    const newStateDataV340Stringified = JsonStringifySortedKeys(value);
    let stateDataWriteCrashNOTWRITTEN = false;
    try {
        await fs.promises.writeFile(state_V340_FilePath, newStateDataV340Stringified, {encoding: "utf8"});
    } catch (e) {
        stateDataWriteCrashNOTWRITTEN = true;
        debug("ERROR to write state_v340.json to disk !!!", `${e}`);
    }

    // let's write state.json after state_v340.json in case of disk full error
    try {
        await fs.promises.writeFile(stateFilePath, oldStateDataStringified, {encoding: "utf8"});
    } catch (e) {
        stateDataWriteCrashNOTWRITTEN = true;
        debug("ERROR to write state.json to disk !!!", e);
    }

    if (stateDataWriteCrashNOTWRITTEN) {
        debug("data not saved due to CRASH so do not remove state.runtime.json and state.patch.json, just exit and try to recover on the next start");
    } else {
        const oldStateDataRead = await fs.promises.readFile(stateFilePath, { encoding: "utf-8" });
        const oldDataWriteIsOldDataRead = oldStateDataRead === oldStateDataStringified;
        const newStateDataRead = await fs.promises.readFile(state_V340_FilePath, { encoding: "utf-8" });
        const newDataWriteIsNewDataRead = newStateDataRead === newStateDataV340Stringified;
        if (oldDataWriteIsOldDataRead && newDataWriteIsNewDataRead) {
            debug("state.json and state_v340.json successfuly written to disk");

            // temporary hack for the 3.4.0 backward compatibility before removing diff patch

            // remove state.json (replace by state_v340.json)
            // remove every state.runtime.json
            // remove state.patch.json
            try {
                debug("remove state.patch.json");
                await rmrf(patchFilePath);
            } catch (e) {
                debug("cannot remove state.patch.json", e);
            }
            try {
                debug("remove state.runtime.json");
                await rmrf(runtimeStateFilePath);
            } catch (e) {
                debug("cannot remove state.runtime.json", e);
            }

        } else {
            debug("oldDataWriteIsOldDataRead", oldDataWriteIsOldDataRead);
            debug("newDataWriteIsNewDataRead", newDataWriteIsNewDataRead);
            debug("ERROR to write state.json and/or state_v340.json to disk, \"data write is date read\" not true, so this is probably a file corruption !!!");
            debug("state.patch.json and state.runtime.json are not removed, so let's recover the state in the next start");
        }
    }

    debug("end of persist reduxState in disk");
};

export function* needToPersistFinalState() {

    const nextState = yield* selectTyped((store: RootState) => store);
    yield call(() => needToPersistPatch());

    // final step because the patch and runtime state is remove if the final state.json is successfuly written to disk
    // Just a temporary hack for the 3.4.0 release, before removing diff patch
    yield call(() => persistStateToFs(nextState));

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
                const jsonObj = action.payload.config as unknown as object;
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

        // TODO: enable publication-storage debounce persistence
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.pdfConfig.ID,
        //     function* (action: readerActions.pdfConfig.TAction) {
        //         const jsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender.type !== SenderType.Renderer) {
        //             debug("sender is not renderer !!!");
        //             return;
        //         }
        //         const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
        //         if (reader) {
        //             const pubId = reader.publicationIdentifier;
        //             yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "pdfConfig", jsonObj));
        //         }

        //     },
        // ),
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.bookmarkTotalCount.ID,
        //     function* (action: readerActions.bookmarkTotalCount.TAction) {
        //         const jsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender.type !== SenderType.Renderer) {
        //             debug("sender is not renderer !!!");
        //             return;
        //         }
        //         const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
        //         if (reader) {
        //             const pubId = reader.publicationIdentifier;
        //             yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "noteTotalCount", jsonObj));
        //         }

        //     },
        // ),
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.allowCustom.ID,
        //     function* (action: readerActions.allowCustom.TAction) {
        //         const jsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender.type !== SenderType.Renderer) {
        //             debug("sender is not renderer !!!");
        //             return;
        //         }
        //         const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
        //         if (reader) {
        //             const pubId = reader.publicationIdentifier;
        //             yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "allowCustomConfig", jsonObj));
        //         }

        //     },
        // ),
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.divina.setReadingMode.ID,
        //     function* (action: readerActions.divina.setReadingMode.TAction) {
        //         const jsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender.type !== SenderType.Renderer) {
        //             debug("sender is not renderer !!!");
        //             return;
        //         }
        //         const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
        //         if (reader) {
        //             const pubId = reader.publicationIdentifier;
        //             yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "divina", jsonObj));
        //         }

        //     },
        // ),
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.setConfig.ID,
        //     function* (action: readerActions.setConfig.TAction) {
        //         const configJsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender.type !== SenderType.Renderer) {
        //             debug("sender is not renderer !!!");
        //             return;
        //         }
        //         const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
        //         if (reader) {
        //             const pubId = reader.publicationIdentifier;
        //             const config: Partial<ReaderConfig> = (yield* callTyped(() => diMainGet("publication-data").getJsonObj(pubId, "config"))) || {};
        //             const configUnion = { ...config, ...configJsonObj };
        //             yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "config", configUnion));
        //         }
        //     },
        // ),
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.disableRTLFlip.ID,
        //     function* (action: readerActions.disableRTLFlip.TAction) {
        //         const rtlFlipJsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender.type !== SenderType.Renderer) {
        //             debug("sender is not renderer !!!");
        //             return;
        //         }
        //         const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
        //         if (reader) {
        //             const pubId = reader.publicationIdentifier;
        //             yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "disableRTLFlip", rtlFlipJsonObj));
        //         }
        //     },
        // ),

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
                    debug(`reader ${pubId} is not the last, ${readersPubId.length} remain(s)`);
                    return;
                }

                // TODO: parallelize with Promise.allSettled
                {
                    const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "locator");
                    if (jsonObj) {
                        // finally save locator next to publication storage vault
                        yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "locator", jsonObj));
                    }
                }
                
                // TODO: enable publication-storage config saving
                // {
                //     const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "config");
                //     if (jsonObj) {
                //         // finally save config next to publication storage vault
                //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "config", jsonObj));
                //     }
                // }

                // {
                //     const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "disableRTLFlip");
                //     if (jsonObj) {
                //         // finally save disableRTLFlip next to publication storage vault
                //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "disableRTLFlip", jsonObj));
                //     }
                // }

                // {
                //     const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "allowCustomConfig");
                //     if (jsonObj) {
                //         // finally save allowCustomConfig next to publication storage vault
                //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "allowCustomConfig", jsonObj));
                //     }
                // }

                // {
                //     const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "divina");
                //     if (jsonObj) {
                //         // finally save divina next to publication storage vault
                //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "divina", jsonObj));
                //     }
                // }

                // {
                //     const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "noteTotalCount");
                //     if (jsonObj) {
                //         // finally save noteTotalCount next to publication storage vault
                //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "noteTotalCount", jsonObj));
                //     }
                // }

                // {

                //     const jsonObj = diMainGet("publication-data").getJsonObj(pubId, "pdfConfig");
                //     if (jsonObj) {
                //         // finally save pdfConfig next to publication storage vault
                //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "pdfConfig", jsonObj));
                //     }
                // }

                // publication data must be closed at the end after publication-storage finish
                yield* callTyped(() => diMainGet("publication-data").close(pubId));
                
            },
            // (e) => error(filename_ + ":winClose", e),
            (e) => debug(e),
        ),
    ]);
}
