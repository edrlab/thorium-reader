// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import { diMainGet, stateFilePath, patchFilePath, closeProcessLock } from "readium-desktop/main/di";
import { PersistRootState } from "readium-desktop/main/redux/states";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, debounce, all } from "redux-saga/effects";
import { flush as flushTyped, call as callTyped } from "typed-redux-saga/macro";
import { winActions } from "../actions";

import { patchChannel } from "./patch";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { readerActions } from "readium-desktop/common/redux/actions";
import { EventPayload } from "readium-desktop/common/ipc/sync";
import { SenderType } from "readium-desktop/common/models/sync";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { IDictWinRegistryReaderState, IWinRegistryReaderState } from "../states/win/registry/reader";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { IWinSessionLibraryState } from "../states/win/session/library";
import { JsonStringifySortedKeys } from "readium-desktop/common/utils/json";
import crypto from "node:crypto";
import { extractWindowMaximized } from "./win/session/browserWindowState";
// import { rmrf } from "readium-desktop/utils/fs";

import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";

// Persist state diffs regularly now that win.registry is disabled.
// Only publication.db and opds remain unbounded (arrays with N elements).
const PATCH_DEBOUNCE_TIME = 1000; // 1 second before dumping to disk
// const PATCH_DEBOUNCE_TIME = 3 * 60 * 1000; // 3 min

// disabled for the 3.4 release
// const PUBLICATION_STORAGE_DEBOUNCE_TIME = 10 * 1000; // 10 secs

// Logger
const filename_ = "readium-desktop:main:saga:persist";
const debug = debug_(filename_);
debug("_");

export const convertDiffableReduxState = (nextState: Partial<PersistRootState>): PersistRootState => {
    const settings = nextState.settings ?
        {
            ...nextState.settings,
            // Command-line forced shared-computer mode must remain scoped to the current process.
            lcpAutoDeleteExpiredPublicationsForced: false,
        }
        : nextState.settings;

    return {
        theme: nextState.theme,
        win: {
            // disable session saving
            session: {
                library: {
                    windowBound: nextState?.win?.session?.library?.windowBound,
                    windowMaximized: nextState?.win?.session?.library?.windowMaximized,
                } as unknown as IWinSessionLibraryState,
                reader: undefined,
            },
            registry: {
                reader: undefined,
            },
        },
        publication: nextState.publication,
        reader: nextState.reader,
        session: {
            save: false,
        },
        screenReader: nextState.screenReader,
        i18n: nextState.i18n,
        opds: nextState.opds,
        version: nextState.version,
        wizard: nextState.wizard,
        settings,
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
};

export const convertPersistedReduxState = (nextState: Partial<PersistRootState>): PersistRootState & { __t: number, __v: string, __state_version: 340 } => {

    return {
        ...convertDiffableReduxState(nextState),
        __t: (new Date()).getTime(),
        __v: _APP_VERSION,
        __state_version: 340,
    };
};


export const convertPublicationToRegistryReaderState = async (pubIds: string[]): Promise<IDictWinRegistryReaderState> => {
    const publicationData = diMainGet("publication-data");

    const readerRegistry: IDictWinRegistryReaderState = {};
    for (const pubId of pubIds) {

        const keys = [
            "config",
            "locator",
            "divina",
            "disableRTLFlip",
            "allowCustomConfig",
            "noteTotalCount",
            "pdfConfig",
            "bound",
        ] as const;

        const results = await Promise.allSettled(keys.map(key => publicationData.readJsonObj(pubId, key)));
        await publicationData.close(pubId);

        const readerState: IWinRegistryReaderState = {
            reduxState: {},
            windowBound: undefined,
        };

        results.forEach((result, index) => {
            const key = keys[index];
            if (result.status === "fulfilled") {
                if (key === "bound") {
                    readerState.windowBound = result.value as any; // TODO: object;
                    readerState.windowMaximized = extractWindowMaximized(result.value);
                } else {
                    readerState.reduxState[key] = result.value as any; // TODO: object
                }
            } else {
                debug(`Failed to load ${key}:`, result.reason);
            }
        });

        const hasData =
            Object.values(readerState.reduxState).some(v => v !== undefined) ||
            readerState.windowBound !== undefined;
        if (hasData) {
            readerRegistry[pubId] = readerState;

            debug(`SAVED reader[${pubId}]: ${JSON.stringify({
                reduxState: {
                    config: typeof readerRegistry[pubId]?.reduxState.config,
                    locator: typeof readerRegistry[pubId]?.reduxState.locator,
                    divina: typeof readerRegistry[pubId]?.reduxState.divina,
                    disableRTLFlip: typeof readerRegistry[pubId]?.reduxState.disableRTLFlip,
                    allowCustomConfig: typeof readerRegistry[pubId]?.reduxState.allowCustomConfig,
                    noteTotalCount: typeof readerRegistry[pubId]?.reduxState.noteTotalCount,
                    pdfConfig: typeof readerRegistry[pubId]?.reduxState.pdfConfig,
                },
                windowBound: typeof readerRegistry[pubId]?.windowBound,
            }, null, 4)}`);
        }

    }
    return readerRegistry;
};

const persistReaderRegistry = async (nextState: Partial<PersistRootState>): Promise<IDictWinRegistryReaderState> => {

    debug("START persisting win.registry.reader state from visited publications on disk");
    const publicationData = diMainGet("publication-data");
    const publicationIdentifierFromPublicationDataBase = Object.keys(nextState?.publication?.db || {});

    // Separate publication IDs into visited and not visited
    const pubIdVisistedSet = publicationIdentifierFromPublicationDataBase.filter((pubId) => publicationData.visited.has(pubId));
    const pubIdNotVisitedSet = publicationIdentifierFromPublicationDataBase.filter((pubId) => !publicationData.visited.has(pubId));
    const registryReaderState = await convertPublicationToRegistryReaderState(pubIdVisistedSet);

    // Preserve registry reader state for not-visited publications (backward compatibility)
    for (const pubId of pubIdNotVisitedSet) {
        if (nextState?.win?.registry?.reader?.[pubId]) {
            registryReaderState[pubId] = nextState.win.registry.reader[pubId];
        }
    }
    debug("END persisting registry reader state (backward compatibility applied)");
    return registryReaderState;
};

const enableTheDumpOfWinRegistryReaderForBackwardCompatibiltyInRuntimeStateWhenCrashOrWindowsReboot = true;
export const persistStateToFs = async (nextState: Partial<PersistRootState>, filePath: string): Promise<void> => {
    debug("START persisting Redux state to", filePath);

    const persistedReduxState = convertPersistedReduxState(nextState);

    let stateDataStringified = JsonStringifySortedKeys(persistedReduxState);
    const checksum = crypto.createHash("sha1").update(stateDataStringified).digest("hex");

    if (enableTheDumpOfWinRegistryReaderForBackwardCompatibiltyInRuntimeStateWhenCrashOrWindowsReboot
        || filePath === stateFilePath) {
        // Add registry.reader for backward compatibility with older state.json versions 330
        persistedReduxState.win.registry.reader = await persistReaderRegistry(nextState);
        stateDataStringified = JsonStringifySortedKeys(persistedReduxState);
    }

    // Prepend checksum at the beginning of the JSON
    stateDataStringified = stateDataStringified.replace(/^{/, `\{\"__checksum\": \"${checksum}\"\,`); // add checksum on the beginning of the file
    debug("Checksum inserted at the beginning of the JSON file (preview):", stateDataStringified.slice(0, 60), "...");


    try {
        debug(`Persist the ${filePath} to disk`);
        await fs.promises.writeFile(filePath, stateDataStringified, { encoding: "utf-8" });
    } catch (e) {
        debug("ERROR writing state.json to disk!", e);
    }

    try {
        const data = await fs.promises.readFile(filePath, { encoding: "utf-8"});
        const reduxState = JSON.parse(data);
        delete (reduxState as any).__checksum;
        delete reduxState.win.registry.reader;
        const reduxStateChecksum = JsonStringifySortedKeys(reduxState);
        const checksumGenerated = crypto.createHash("sha1").update(reduxStateChecksum).digest("hex");
        if (checksumGenerated === checksum) {
            debug("Checksum verified and valid after the final state was written");
        } else {
            debug("Checksum mismatch detected!");
        }
    } catch (e) {
        debug(`CRITICAL ERROR: ${filePath} not verified and valid; ${e}`);
    }

    debug("END persisting Redux state to disk");
};

export function* needToPersistFinalState(reduxState: Partial<PersistRootState>) {

    yield call(() => needToPersistPatch()); // before final state
    yield call(() => persistStateToFs(reduxState, stateFilePath));
}

export function* needToPersistPatch() {

    if (closeProcessLock.isLock) {
        return ;
    }

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
            PATCH_DEBOUNCE_TIME,
            winActions.persistRequest.ID,
            needToPersistPatch,
        ),
        // takeSpawnLeading(
        //     winActions.session.registerReader.ID,
        //     function* (action: winActions.session.registerReader.TAction) {
        //         const payload = action.payload;
        //         const boundJsonObj = payload.winBound;
        //         const pubId = action.payload.publicationIdentifier;

        //         yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "bound", boundJsonObj));
        //     },
        //     (e) => debug(e),
        // ),
        // takeSpawnLeading(
        //     winActions.session.setBound.ID,
        //     function* (action: winActions.session.setBound.TAction) {
        //         const payload = action.payload;
        //         const identifier = payload.windowIdentifier;
        //         const boundJsonObj = payload.winBound;

        //         const reader = yield* selectTyped((state: RootState) => state.win.session.reader[identifier]);
        //         if (!reader) {
        //             debug("ERROR!!! no reader sender found in session !!!");
        //             return;
        //         }
        //         const pubId = reader.publicationIdentifier;

        //         yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "bound", boundJsonObj));
        //     },
        //     (e) => debug(e),
        // ),
        takeSpawnLeading(
            readerActions.pdfConfig.ID,
            function* (action: readerActions.pdfConfig.TAction) {
                const jsonObj = action.payload.config as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const pubId = sender.reader_pubId; // see syncFactory
                // const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                // if (!reader) {
                //     debug("ERROR!!! no reader sender found in session !!!");
                //     return;
                // }
                // const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "pdfConfig", jsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.bookmarkTotalCount.ID,
            function* (action: readerActions.bookmarkTotalCount.TAction) {
                const jsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const pubId = sender.reader_pubId; // see syncFactory
                // const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                // if (!reader) {
                //     debug("ERROR!!! no reader sender found in session !!!");
                //     return;
                // }
                // const pubId = reader.publicationIdentifier;

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

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const pubId = sender.reader_pubId; // see syncFactory
                // const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                // if (!reader) {
                //     debug("ERROR!!! no reader sender found in session !!!");
                //     return;
                // }
                // const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "allowCustomConfig", jsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.divina.setReadingMode.ID,
            function* (action: readerActions.divina.setReadingMode.TAction) {
                const divinaReadingMode = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const pubId = sender.reader_pubId; // see syncFactory
                // const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                // if (!reader) {
                //     debug("ERROR!!! no reader sender found in session !!!");
                //     return;
                // }
                // const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "divina", divinaReadingMode));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.disableRTLFlip.ID,
            function* (action: readerActions.disableRTLFlip.TAction) {
                const rtlFlipJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const pubId = sender.reader_pubId; // see syncFactory
                // const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                // if (!reader) {
                //     debug("ERROR!!! no reader sender found in session !!!");
                //     return;
                // }
                // const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "disableRTLFlip", rtlFlipJsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.setLocator.ID,
            function* (action: readerActions.setLocator.TAction) {
                const locatorJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const pubId = sender.reader_pubId; // see syncFactory
                // const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                // if (!reader) {
                //     debug("ERROR!!! no reader sender found in session !!!");
                //     return;
                // }
                // const pubId = reader.publicationIdentifier;

                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "locator", locatorJsonObj));
            },
            (e) => debug(e),
        ),
        takeSpawnLeading(
            readerActions.setConfig.ID,
            function* (action: readerActions.setConfig.TAction) {
                const configJsonObj = action.payload as unknown as object;
                const sender = action.sender as EventPayload["sender"];

                if (sender?.type !== SenderType.Renderer) {
                    debug("sender is not renderer !!!");
                    return;
                }
                const pubId = sender.reader_pubId; // see syncFactory
                // const reader = yield* selectTyped((state: RootState) => state.win.session.reader[sender.identifier]);
                // if (!reader) {
                //     debug("ERROR!!! no reader sender found in session !!!");
                //     return;
                // }
                // const pubId = reader.publicationIdentifier;

                const config: Partial<ReaderConfig> = (yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "config"))) || {};
                const configUnion = { ...config, ...configJsonObj, ...{ annotation_defaultDrawView: action.payload.annotation_defaultDrawView === "hide" ? readerConfigInitialState.annotation_defaultDrawView : action.payload.annotation_defaultDrawView } };
                yield* callTyped(() => diMainGet("publication-data").writeJsonObj(pubId, "config", configUnion));
            },
            (e) => debug(e),
        ),
        // disabled for the 3.4 release
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.setLocator.ID,
        //     function* (action: readerActions.setLocator.TAction) {
        //         const jsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender?.type !== SenderType.Renderer) {
        //             debug("sender is not renderer !!!");
        //             return;
        //         }
        //         const pubId = sender.reader_pubId; // see syncFactory
        //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(pubId, "locator", jsonObj));
        //     },
        // ),

        // TODO: enable publication-storage debounce persistence
        // debounce(
        //     PUBLICATION_STORAGE_DEBOUNCE_TIME,
        //     readerActions.pdfConfig.ID,
        //     function* (action: readerActions.pdfConfig.TAction) {
        //         const jsonObj = action.payload as unknown as object;
        //         const sender = action.sender as EventPayload["sender"];

        //         if (sender?.type !== SenderType.Renderer) {
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

        //         if (sender?.type !== SenderType.Renderer) {
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

        //         if (sender?.type !== SenderType.Renderer) {
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

        //         if (sender?.type !== SenderType.Renderer) {
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

        //         if (sender?.type !== SenderType.Renderer) {
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

        //         if (sender?.type !== SenderType.Renderer) {
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
        //     winActions.reader.openSucess.ID,
        //     winOpen,
        //     (e) => error(filename_ + ":winOpen", e),
        // ),
    ]);
}
