// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import {
    diMainGet, memoryLoggerFilename, patchFilePath, runtimeDiffStateFilePath, runtimeStateFilePath, stateDiffFilePath, stateFilePath,
} from "readium-desktop/main/di";
import { reduxSyncMiddleware } from "readium-desktop/main/redux/middleware/sync";
import { rootReducer } from "readium-desktop/main/redux/reducers";
import { rootSaga } from "readium-desktop/main/redux/sagas";
import { PersistRootState, RootState } from "readium-desktop/main/redux/states";
import { tryCatch, tryCatchSync } from "readium-desktop/utils/tryCatch";
import { applyMiddleware, legacy_createStore as createStore, type Store } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";
import { applyPatch } from "rfc6902";

import { reduxPersistMiddleware } from "../middleware/persistence";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import { MiniLocatorExtended, minimizeLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { EDrawType, INoteState, NOTE_DEFAULT_COLOR_OBJ, TDrawType } from "readium-desktop/common/redux/states/renderer/note";
import { TBookmarkState } from "readium-desktop/common/redux/states/bookmark";
import { TAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { sqliteInitTableNote, sqliteTableNoteDeleteWherePubId, sqliteTableNoteInsert, sqliteTableSelectLastModifiedDateWherePubId } from "readium-desktop/main/db/sqlite/note";
import { sqliteInitialisation } from "readium-desktop/main/db/sqlite";
import { IReaderPdfConfig, IReaderStateReaderSession } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { IDictWinRegistryReaderState, IWinRegistryReaderState } from "readium-desktop/main/redux/states/win/registry/reader";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { IRTLFlipState } from "readium-desktop/common/redux/states/renderer/rtlFlip";
import { IAllowCustomConfigState } from "readium-desktop/common/redux/states/renderer/allowCustom";
import { IDivinaState } from "readium-desktop/common/redux/states/renderer/divina";
import { IBookmarkTotalCountState } from "readium-desktop/common/redux/states/renderer/bookmarkTotalCount";
import { convertPublicationToRegistryReaderState, persistStateToFs } from "../sagas/persist";
import { app, dialog } from "electron";
import { error } from "readium-desktop/main/tools/error";
import { getFileSize, rmrf } from "readium-desktop/utils/fs";
import crypto from "node:crypto";
import { JsonStringifySortedKeys } from "readium-desktop/common/utils/json";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import * as ramda from "ramda";
import { appendFileSyncWithRotation } from "readium-desktop/utils/log";

// import { composeWithDevTools } from "remote-redux-devtools";
const REDUX_REMOTE_DEVTOOLS_PORT = 7770;

const _dbgn = "readium-desktop:main:store:memory";
const debugStdout = debug_(_dbgn);
// Logger
const debug = (...a: Parameters<debug_.Debugger>) => {
    debugStdout(...a);
    tryCatchSync(() =>
        appendFileSyncWithRotation(memoryLoggerFilename, a.map((v) => `${+new Date()} ${JSON.stringify(v)}`).join("\n") + "\n"),
        "",
    );
};

/**
 * Deep diff of two objects
 * Returns an object with keys where values differ
 */
const deepDiff = (obj1: any, obj2: any) => {
    if (ramda.equals(obj1, obj2)) return undefined; // no diff

    if (ramda.is(Object, obj1) && ramda.is(Object, obj2)) {
        const allKeys = ramda.union(ramda.keys(obj1), ramda.keys(obj2));
        const diffObj = ramda.reduce((acc, key) => {
            const diff = deepDiff(obj1[key], obj2[key]);
            if (diff !== undefined) (acc as any)[key] = diff;
            return acc;
        }, {}, allKeys);
        return ramda.isEmpty(diffObj) ? undefined : diffObj;
    }

    // primitive values differ
    return { before: obj1, after: obj2 };
};

const test = (stateRaw: any): stateRaw is PersistRootState => {
    if (typeof stateRaw === "object" && 

    // Only check the `publication` key to avoid exceptions
    // when legitimate publication database arrays are missing `win` or `reader` keys.
    // The state may remain inconsistent, but we must not remove the publications DB.
    typeof stateRaw.publication === "object")
    // ok(stateRaw.win);
    // ok(stateRaw.reader);
    // ok(stateRaw.session);
    {
        return true;
    }
    return false;
};

const testV340 = (stateRaw: any): stateRaw is PersistRootState => {
    // __t, __v, __state_version, and __checksum are internal keys added during persistence (v340)
    if (
        test(stateRaw) &&
        // Skip checking DateTime fields (__t) because they vary on each persistence
        // (stateRaw as any).__t &&
        (stateRaw as any).__v &&
        (stateRaw as any).__state_version === 340 // &&
        // do not check checksum type because not always required
        // typeof (stateRaw as any).__checksum === "string"
    ) {
        return true;
    }
    return false;
};

const recoveryReduxState = async (runtimeState: object): Promise<object | undefined> => {

    const patchFileStrRaw = await tryCatch(() => fs.promises.readFile(patchFilePath, { encoding: "utf8" }), "") || ""; // default empty string list
    const patchFileStr = "[" + patchFileStrRaw.slice(0, -2) + "]"; // remove the last comma
    const patch = await tryCatch(() => JSON.parse(patchFileStr), "") || [];

    if (!Array.isArray(patch)) {
        return undefined;
    }

    // RangeError: Maximum call stack size exceeded
    // diffAny
    // node_modules/rfc6902/diff.js:262:17
    // dist
    // node_modules/rfc6902/diff.js:135:36
    try {
        const errors = applyPatch(runtimeState, patch);
        const hasError = Array.isArray(errors) && errors.some(Boolean);
        if (hasError) {
            debug("recoveryReduxState ERRORS:", errors);
            return undefined;
        }
    } catch (e) {
        debug("recoveryReduxState", e);
    }

    return runtimeState;
};


type TReduxStateParsed = Partial<{
    reduxStateWinRegistryReader: IDictWinRegistryReaderState
    version: 330 | 340,
    appVersion: string,
    checksum: boolean,
    timestamp: number,
    reduxState: PersistRootState,
    filePath: string,
}>;

const validateReduxState = (reduxState: any): TReduxStateParsed => {

    let reduxStateWinRegistryReader: IDictWinRegistryReaderState | undefined;
    if (testV340(reduxState)) {
        debug("State detected: version 340");
        debug("State Timestamp:", (reduxState as any).__t);
        debug("State Version:", (reduxState as any).__v);
        debug("State Checksum:", (reduxState as any).__checksum || "undefined");

        // delete checksum value to compute it
        const stateChecksum = (reduxState as any).__checksum as string;
        delete (reduxState as any).__checksum;

        // delete win.registry.reader backward compatible state
        if (reduxState?.win?.registry?.reader) {
            reduxStateWinRegistryReader = JSON.parse(JSON.stringify(reduxState.win.registry.reader));
            delete reduxState.win.registry.reader;
            debug("Removed key: win.registry.reader");
        } else {
            debug("Key not found: win.registry.reader");
        }

        // compute checksum
        const reduxStateChecksum = JsonStringifySortedKeys(reduxState);
        const checksumGenerated = crypto.createHash("sha1").update(reduxStateChecksum).digest("hex");

        // delete DateTime/Version after checksum comparaison
        const timestamp = (reduxState as any).__t;
        delete (reduxState as any).__t;
        const appVersion = (reduxState as any).__v;
        delete (reduxState as any).__v;
        delete (reduxState as any).__state_version;

        debug(`Checksum comparison → generated:${checksumGenerated}, received:${stateChecksum || "undefined"}`);
        let checksumValid = false;
        if (stateChecksum && stateChecksum === checksumGenerated) {
            debug("Checksum valid");
            checksumValid = true;
        } else {
            debug("Checksum mismatch → starting recovery process");
        }

        return {
            reduxStateWinRegistryReader,
            version: 340,
            appVersion,
            checksum: checksumValid,
            timestamp,
            reduxState,
        };
    } else if (test(reduxState)) {
        debug("State detected: version 330 (legacy format)");
        return {
            version: 330,
            reduxState,
        };
    } else {
        debug("The state is a json file but not a valid Thorium 3.x version");
    }

    return {};
};

const parseAndValidateReduxState = async (filePath: string) => {

    debug("State filePath=", filePath);
    const reduxStateStr = await fs.promises.readFile(filePath, { encoding: "utf-8" });
    const reduxState = JSON.parse(reduxStateStr);
    const reduxStateParsed = validateReduxState(reduxState);
    reduxStateParsed.filePath = filePath;
    return reduxStateParsed;
};

const validateRecoveredReduxState = (reduxRecoveredState: object, reduxState: PersistRootState): reduxRecoveredState is PersistRootState => {

    if (test(reduxRecoveredState)) {
        debug("Recovered state is valid (runtime + patch)");
    } else {
        debug("Recovered state not valid (why?)");
        debug(reduxRecoveredState);
        return false;
    }
    if (ramda.equals(reduxRecoveredState, reduxState)) {
        debug("State consistency check passed (file === runtime+patch)");
    } else {
        debug("State mismatch detected (file !== runtime+patch)");
        debug("Overriding state with recovered runtime+patch version");

        debug("State runtime+patch written to ", runtimeDiffStateFilePath);
        Promise.resolve().then(() => fs.promises.writeFile(runtimeDiffStateFilePath, JsonStringifySortedKeys(reduxRecoveredState), { encoding: "utf-8" })).catch(() => {});

        debug("State reduxState written to ", stateDiffFilePath);
        Promise.resolve().then(() => fs.promises.writeFile(stateDiffFilePath, JsonStringifySortedKeys(reduxState), { encoding: "utf-8" })).catch(() => {});

        debug("Diff:");
        try { debug(JSON.stringify(deepDiff(reduxRecoveredState, reduxState), null, 4)); } catch { }

        // TODO: implement reconciliation between persisted state and runtime+patch
        // Current behavior: runtime+patch takes precedence if checksum mismatch
    }
    return true; // to overide final redux state even if the runtime+patch did not match with the current final state
};

const loadRuntimeReduxState = async (): Promise<TReduxStateParsed> => {
    let runtimeStateParsed: TReduxStateParsed = {};
    try {
        debug("Parse and validate runtime state");
        runtimeStateParsed = await parseAndValidateReduxState(runtimeStateFilePath);
        debug("RUNTIME state loaded:", runtimeStateParsed);
    } catch (e) {
        debug("Error loading RUNTIME state:", `${e}`);
    }

    if (runtimeStateParsed.version === 340) {
        debug("RUNTIME state version is 340");

        if (runtimeStateParsed.checksum) {
            debug("RUNTIME checksum is valid");
        } else {
            debug("Invalid RUNTIME checksum → skipping RUNTIME");
            // do not return runtime state
            return {};
        }
    } else if (runtimeStateParsed.version === 330) {
        debug("Legacy RUNTIME state (3.3)");
    } else {
        debug("RUNTIME state not found");
    }

    return runtimeStateParsed;
};



const loadReduxState = async (): Promise<TReduxStateParsed> => {
    let reduxStateParsed: TReduxStateParsed = {};
    try {
        debug("Parse and validate final state");
        reduxStateParsed = await parseAndValidateReduxState(stateFilePath);
        debug("FINAL state loaded:", reduxStateParsed);
    } catch (e) {
        debug("Error loading FINAL state:", `${e}`);
    }

    if (reduxStateParsed.version === 340) {
        debug("FINAL state version is 340");

        if (reduxStateParsed.checksum) {
            debug("FINAL state checksum is valid");
        } else {
            debug("FINAL checksum invalid → fallback to RUNTIME");
            // do not return state
            return {};
        }

    } else if (reduxStateParsed.version === 330) {
        debug("FINAL state is legacy (not 340) → returning as-is");
    } else {
        debug("FINAL state not found → fallback to RUNTIME");
    }

    return reduxStateParsed;
};

const loadResolvedReduxState = async (): Promise<TReduxStateParsed> => {

    // TODO: Load the runtime state in parallel. 
    // Note: In the normal working mode, this runtime state is not used,
    // but it can provide useful debugging/logging information.
    const reduxStateParsed = await loadReduxState();
    const runtimeStateParsed = await loadRuntimeReduxState();

    if (reduxStateParsed.version === 340) {
        if (runtimeStateParsed.version === 340) {

            if (reduxStateParsed.timestamp > runtimeStateParsed.timestamp) {
                debug("FINAL state is more recent than RUNTIME state → keep FINAL");
            } else {
                debug("RUNTIME state is newer → attempt recovery");

                // Duplicate the current Redux state to safely apply recovery patches without mutating the original runtime state.
                debug("RUNTIME redux state duplicated for recovery processing");
                const duplicatedReduxState = JSON.parse(JSON.stringify(runtimeStateParsed.reduxState));
                const reduxRecoveredState = await recoveryReduxState(duplicatedReduxState);

                if (validateRecoveredReduxState(reduxRecoveredState, reduxStateParsed.reduxState)) {
                    debug("Recovery successful → using recovered state");

                    return {
                        version: 340,
                        reduxState: reduxRecoveredState,
                    };
                } else {
                    debug("Recovery failed → keep RUNTIME");
                    return runtimeStateParsed;
                }
            }
        } else {
            debug("RUNTIME state is invalid → keep FINAL");
        }
    } else if (reduxStateParsed.version === 330) {
        debug("FINAL state is legacy (not 340) → returning as-is");
    } else {
        if (runtimeStateParsed.version === 340) {

            // Duplicate the current Redux state to safely apply recovery patches without mutating the original runtime state.
            debug("RUNTIME redux state duplicated for recovery processing");
            const duplicatedReduxState = JSON.parse(JSON.stringify(runtimeStateParsed.reduxState));
            const reduxRecoveredState = await recoveryReduxState(duplicatedReduxState);

            if (test(reduxRecoveredState)) {
                debug("Recovery successful → using recovered state");

                return {
                    version: 340,
                    reduxState: reduxRecoveredState,
                };
            } else {
                debug("Recovery failed → keep RUNTIME");
                return runtimeStateParsed;
            }
        } else if (runtimeStateParsed.reduxState) {
            debug("RUNTIME state is legacy (not 340) → returning as-is");
            return runtimeStateParsed;
        } else {
            debug("RUNTIME state is invalid → keep EMPTY");
        }
    }

    debug("[loadResolvedReduxState] Redux state resolved:", reduxStateParsed);
    return reduxStateParsed;
};

export async function initStore()
    : Promise<[Store<RootState>, SagaMiddleware<object>]> {

    debug("START MEMORY INIT STORE");

    /*
    // See PR for the forward and backward migration v3.3 <-> v3.4
    // https://github.com/edrlab/thorium-reader/pull/3423
    // AND
    // https://github.com/edrlab/thorium-reader/pull/3471
    
    This logic implements a safe and resilient Redux state loading strategy
    designed to protect user data against corruption and unexpected shutdowns.
    
    At startup, the application attempts to load the persisted state from disk (`state.json`).
    If the state is in the modern format (v340), its integrity is verified using a checksum.
    If the checksum is valid, the state is considered reliable. Otherwise, it is treated as corrupted.
    
    In parallel, the application also checks the runtime file (`state.runtime.json`), which represents the state at startup.
    This runtime state is combined with a JSON diff patch (the list of changes applied during the application lifetime)
    to reconstruct the runtime+patch state, i.e. the most up-to-date in-memory state prior to shutdown.
    
    If this runtime+patch state is valid and more recent than the main state, or if the main state is corrupted, it is used instead.
    A recovery process is applied to ensure the reconstructed state is consistent.
    
    The final state is selected using the following priority:
    * Valid main state (state.json)
    * Valid recovered runtime+patch state
    * Valid runtime state
    * Legacy state (v330, without checksum)
    * Empty state (fallback in case of failure)
    
    Once the application is initialized, the resolved state is immediately persisted back to disk:
    * First written to the runtime file
    * Then copied to the main state file
    
    The state is also persisted again on application shutdown.
    
    This ensures that:
    * The application can recover from crashes or incomplete writes
    * Corrupted states are automatically detected and bypassed
    * The most recent valid state is always preferred
    
    Note: In recovery scenarios, the system intentionally favors availability over strict consistency.
    A recovered state may override the previous one even if differences are detected.
    
    */

    const { reduxState, version, reduxStateWinRegistryReader, filePath }: TReduxStateParsed = await loadResolvedReduxState();

    const showErrorElectronDialog = false;
    if (!reduxState) {
        debug("No existing state.json found. This may indicate:");
        if (!tryCatchSync(() => getFileSize(stateFilePath), "")) {
            debug("- First application launch (initial state will be written to disk)");
        } else {
            debug("- Corrupted state previously stored on disk, now reset to a fresh state");
            if (showErrorElectronDialog) {
                dialog.showErrorBox(
                    "Data reset required",
                    "The application detected that its saved data was corrupted and could not be recovered.\n\n" +
                    "A new clean state has been created to allow the application to start normally.\n\n" +
                    "Previous data and settings have been lost.",
                );
            }
        }

        debug("####### WARNING ######");
        debug("Thorium starts with an undefined global state");
        debug("The publication database will be lost!");
        debug("####### WARNING ######");
    } else {
        if (filePath === runtimeStateFilePath && showErrorElectronDialog) {
            dialog.showErrorBox(
                "Unexpected shutdown detected",
                "The application did not shut down properly last time, which caused an issue with its saved data.\n\n" +
                "A recovery process has been performed automatically.\n\n" +
                "Some recent data or settings may have been lost.",
            );
        }
        if (version === 330 && showErrorElectronDialog) {
            app.whenReady().then(() => {
                dialog.showMessageBox({
                    type: "info",
                    title: "Update complete",
                    message: "Your data has been successfully updated to the latest version. " + _APP_VERSION,
                });
            });
        }
        debug("State successfully loaded from filesystem");
        debug("Initialization complete");
    }

    debug("START redux hydration state with VALUE →", typeof reduxState, reduxState ? Object.keys(reduxState) : "nil");
    // debug(reduxState);

    // const forceDisableReaderDefaultConfigAndSessionForTheNewUI: Partial<PersistRootState> = {
        // reader: {

        //     // reader default config could be removed
        //     // defaultConfig: readerConfigInitialState,

        //     // just disableRTLFlip use yet
        //     disableRTLFlip: reduxState?.reader?.disableRTLFlip || { disabled: defaultDisableRTLFLip },
        // },
        // session: {

        //     // not used anymore, just force to true in main and lib, but not declared in reader (false by default)
        //     // state: true,

        //     // save is used to know if the session must be saved at the end
        //     // save: reduxState?.session?.save || false,
        // },
    // };
    // const preloadedState = reduxState ? {
    //     ...reduxState,
    //     ...forceDisableReaderDefaultConfigAndSessionForTheNewUI,
    // } : {
    //     ...forceDisableReaderDefaultConfigAndSessionForTheNewUI,
    // };
    const preloadedState: Partial<PersistRootState> = reduxState ? {
        ...reduxState,
    } : {};

    // SQLITE
    sqliteInitialisation();
    sqliteInitTableNote();

    // Initialized win.registry.reader as an empty object instead of using the null reducer value.
    if (!preloadedState.win) {
        preloadedState.win = {} as any;
    }
    if (!preloadedState.win.registry) {
        preloadedState.win.registry = {} as any;
    }
    if (!preloadedState.win.registry.reader) {
        preloadedState.win.registry.reader = {};
    }


    if (version === 330) {

        debug("START reader registry migration from the 330 version");

        let pubIdFromDatabase: string[] = [];
        if (preloadedState?.publication?.db) {
            pubIdFromDatabase = Object.keys(preloadedState.publication.db);
        }

        for (const pubId in preloadedState.win.registry.reader) {
            debug(`reader[${pubId}] need to be migrated`);
            const state = preloadedState.win.registry.reader[pubId];

            if (state?.reduxState?.locator) {
                const locatorExtended = state.reduxState.locator as LocatorExtended;
                if (locatorExtended.followingElementIDs) {
                    debug("REMOVE preloadedState.win.registry.reader[id].reduxState.locator.followingElementIDs (LocatorExtended): ", locatorExtended.followingElementIDs.length);
                }
                // REMOVE locatorExtended.followingElementIDs, no-op if property does not exist (same object returned)
                state.reduxState.locator = minimizeLocatorExtended(locatorExtended);

                // SEE isDivinaLocation duck typing hack with totalProgression injection!!
                const locations = state.reduxState.locator.locator?.locations as any;
                if (locations?.totalProgression) {
                    debug("INFO DIVINA preloadedState.win.registry.reader[id].reduxState.locator.locations.totalProgression: ", locations.totalProgression);
                }

                if ((state.reduxState.locator.locator?.locations as any)?.rangeInfo) {
                    state.reduxState.locator.locator.locations.caretInfo = {
                        rangeInfo: (state.reduxState.locator.locator.locations as any).rangeInfo,
                        textFragment: undefined,
                        cleanBefore: "",
                        cleanText: "",
                        cleanAfter: "",
                        rawBefore: "",
                        rawText: "",
                        rawAfter: "",
                    };
                }
            }

            if ((state?.reduxState as any)?.annotation) {
                for (const annotation of (state.reduxState as any).annotation as TAnnotationState) {
                    if (annotation[1].locatorExtended) {
                        const locatorExtended = annotation[1].locatorExtended as LocatorExtended;
                        if (locatorExtended.followingElementIDs) {
                            debug("REMOVE preloadedState.win.registry.reader[id].reduxState.annotation[i].locatorExtended.followingElementIDs (LocatorExtended): ", locatorExtended.followingElementIDs.length);
                        }

                        if ((annotation[1].locatorExtended.locator.locations as any)?.rangeInfo) {
                            annotation[1].locatorExtended.locator.locations.caretInfo = {
                                rangeInfo: (annotation[1].locatorExtended.locator.locations as any).rangeInfo,
                                textFragment: undefined,
                                cleanBefore: "",
                                cleanText: "",
                                cleanAfter: "",
                                rawBefore: "",
                                rawText: "",
                                rawAfter: "",
                            };
                        }
                        // REMOVE locatorExtended.followingElementIDs, no-op if property does not exist (same object returned)
                        annotation[1].locatorExtended = minimizeLocatorExtended(annotation[1].locatorExtended);
                    }
                }
            }

            if ((state?.reduxState as any)?.bookmark) {
                for (const bookmark of (state.reduxState as any).bookmark as TBookmarkState) {
                    if ((bookmark[1] as any)?.locator) {
                        bookmark[1].locatorExtended = {
                            locator: (bookmark[1] as any).locator,
                            audioPlaybackInfo: undefined,
                            paginationInfo: undefined,
                            selectionInfo: undefined,
                            selectionIsNew: undefined,
                            docInfo: undefined,
                            epubPage: undefined,
                            epubPageID: undefined,
                            headings: undefined,
                            secondWebViewHref: undefined,
                        };
                        (bookmark[1] as any).locator = undefined;
                        delete (bookmark[1] as any).locator;
                    }
                    if (bookmark[1].locatorExtended) {
                        const locatorExtended = bookmark[1].locatorExtended as LocatorExtended;
                        if (locatorExtended.followingElementIDs) {
                            debug("REMOVE preloadedState.win.registry.reader[id].reduxState.bookmark[i].locatorExtended.followingElementIDs (LocatorExtended): ", locatorExtended.followingElementIDs.length);
                        }

                        if ((bookmark[1].locatorExtended.locator.locations as any)?.rangeInfo) {
                            bookmark[1].locatorExtended.locator.locations.caretInfo = {
                                rangeInfo: (bookmark[1].locatorExtended.locator.locations as any).rangeInfo,
                                textFragment: undefined,
                                cleanBefore: "",
                                cleanText: "",
                                cleanAfter: "",
                                rawBefore: "",
                                rawText: "",
                                rawAfter: "",
                            };
                        }
                        // REMOVE locatorExtended.followingElementIDs, no-op if property does not exist (same object returned)
                        bookmark[1].locatorExtended = minimizeLocatorExtended(bookmark[1].locatorExtended);
                    }
                    if (!bookmark[1].color) {
                        bookmark[1].color = { ...NOTE_DEFAULT_COLOR_OBJ };
                    }
                }
            }

            if (state?.reduxState) {
                if (!(state.reduxState as any).note) {
                    (state.reduxState as any).note = [];
                } else if ((state.reduxState as Partial<IReaderStateReaderSession>).note?.length) {


                    debug("We are checking notes (", (state.reduxState as Partial<IReaderStateReaderSession>).note?.length, "); json to sqlite migration for pubicationId=", pubId);

                    const lastNoteModifiedEpochFromJson = (state.reduxState as Partial<IReaderStateReaderSession>).note.reduce((acc, cv) => {

                        const currentModifiedEpoch = cv.modified || cv.created;
                        if (currentModifiedEpoch > acc) {
                            return currentModifiedEpoch;
                        }
                        return acc;

                    }, 0);

                    const lastNotesModifiedEpochFromSqlite = sqliteTableSelectLastModifiedDateWherePubId(pubId);


                    debug("lastNoteModifiedEpochFromJson=", lastNoteModifiedEpochFromJson, "lastNotesModifiedEpochFromSqlite=", lastNotesModifiedEpochFromSqlite);

                    if (lastNotesModifiedEpochFromSqlite >= lastNoteModifiedEpochFromJson) {
                        debug("SQLITE WON, no migration");
                    } else {
                        debug("JSON WON, migration needed!!");
                        if (sqliteTableNoteDeleteWherePubId(pubId)) {
                            if (sqliteTableNoteInsert(pubId, (state.reduxState as any).note)) {
                                debug("SQLITE NOTE MIGRATION DONE for this publicationId=", pubId);
                            } else {
                                debug("ERROR on SQLITE NOTE MIGRATION, publicationId=", pubId);
                            }
                        } else {
                            debug("ERROR cannot delete note attached to pubId=", pubId);
                        }
                    }
                }
            }

            if ((state?.reduxState as any)?.bookmarkTotalCount !== undefined) {
                if (!state.reduxState.noteTotalCount?.state) {
                    state.reduxState.noteTotalCount = {
                        state: 0,
                    };
                }
                state.reduxState.noteTotalCount.state = (state?.reduxState as any)?.bookmarkTotalCount?.state || 0;
                (state.reduxState as any).bookmarkTotalCount = undefined;
            }

            if ((state?.reduxState as any)?.bookmark) {

                let noteTotalCount = state.reduxState.noteTotalCount?.state || 0;
                for (const [_timestamp, bookmark] of (state.reduxState as any).bookmark as TBookmarkState) {

                    const note: INoteState = {
                        uuid: bookmark.uuid,
                        index: bookmark.index || ++noteTotalCount,
                        locatorExtended: bookmark.locatorExtended,
                        textualValue: bookmark.name,
                        color: bookmark.color,
                        drawType: EDrawType.bookmark,
                        tags: bookmark.tags,
                        modified: bookmark.modified,
                        created: bookmark.created,
                        creator: bookmark.creator,
                        group: "bookmark",
                    };

                    sqliteTableNoteInsert(pubId, [ note ]);
                }
                (state.reduxState as any).bookmark = undefined;

                if (!state.reduxState.noteTotalCount?.state) {
                    state.reduxState.noteTotalCount = {
                        state: 0,
                    };
                }
                state.reduxState.noteTotalCount.state = noteTotalCount;
            }

            if ((state?.reduxState as any)?.annotation ) {

                let noteTotalCount = state.reduxState.noteTotalCount?.state || 0;
                for (const [_timestamp, annotation] of ((state.reduxState as any).annotation as TAnnotationState)) {

                    const note: INoteState = {
                        uuid: annotation.uuid,
                        index: ++noteTotalCount,
                        locatorExtended: annotation.locatorExtended,
                        textualValue: annotation.comment,
                        color: annotation.color,
                        drawType: EDrawType[annotation.drawType as TDrawType] || EDrawType.solid_background,
                        tags: annotation.tags,
                        modified: annotation.modified,
                        created: annotation.created,
                        creator: annotation.creator,
                        group: "annotation",
                    };

                    sqliteTableNoteInsert(pubId, [ note ]);
                }
                (state.reduxState as any).annotation = undefined;

                if (!state.reduxState.noteTotalCount?.state) {
                    state.reduxState.noteTotalCount = {
                        state: 0,
                    };
                }
                state.reduxState.noteTotalCount.state = noteTotalCount;
            }

            const publicationData = diMainGet("publication-data");
            if (pubIdFromDatabase.includes(pubId)) {
                debug("MIGRATION TO Publication-data file storage ->", pubId);

                // For test purpose only
                // await new Promise((resolve) => setTimeout(resolve, 10000));

                
                // publicationStorage is not used for the 340 for the moment, wait 350 to add this evolution
                // const publicationStorage = diMainGet("publication-storage");

                const promiseArray: Promise<void>[] = [];

                if (state?.reduxState?.locator) {
                    debug("\t => locator");
                    const jsonObj = state.reduxState.locator as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "locator", jsonObj));
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "locator", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                if (state?.reduxState?.config) {
                    debug("\t => config");
                    const jsonObj = state.reduxState.config as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "config", jsonObj));
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "config", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                // TODO: factorize to reader config
                // TODO: enable publication-storage persistence
                if (state?.reduxState?.disableRTLFlip) {
                    debug("\t => disableRTLFlip");
                    const jsonObj = state.reduxState.disableRTLFlip as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "disableRTLFlip", jsonObj));
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "disableRTLFlip", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                // TODO: factorize to reader config
                // TODO: enable publication-storage persistence
                if (state?.reduxState?.divina) {
                    debug("\t => disableRTLFlip");
                    const jsonObj = state.reduxState.divina as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "divina", jsonObj));
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "divina", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                // TODO: factorize to reader config
                // TODO: enable publication-storage persistence
                if (state?.reduxState?.allowCustomConfig) {
                    debug("\t => disableRTLFlip");
                    const jsonObj = state.reduxState.allowCustomConfig as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "allowCustomConfig", jsonObj));
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "allowCustomConfig", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                // TODO: remove this unused state in the future
                // TODO: enable publication-storage persistence
                if (state?.reduxState?.noteTotalCount) {
                    debug("\t => disableRTLFlip");
                    const jsonObj = state.reduxState.noteTotalCount as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "noteTotalCount", jsonObj));
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "noteTotalCount", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                // TODO: factorize to reader config
                // TODO: enable publication-storage persistence
                if (state?.reduxState?.pdfConfig) {
                    debug("\t => disableRTLFlip");
                    const jsonObj = state.reduxState.pdfConfig as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "pdfConfig", jsonObj));
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "pdfConfig", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                if (state?.windowBound) {
                    debug("\t => bound");
                    const jsonObj = state.windowBound as unknown as object;
                    promiseArray.push(publicationData.writeJsonObj(pubId, "bound", jsonObj));
                }

                const promisesSettledResult = await Promise.allSettled(promiseArray);

                for (const p of promisesSettledResult) {
                    if (p.status === "fulfilled") {
                        debug("\t\tok!");
                    } else {
                        debug(p.reason);
                    }
                }

                try {
                    await publicationData.close(pubId);
                } catch (e) {
                    debug(e);
                }
            } else {
                debug("Migration to publication-data storage skipped: pubID not found in publication.db", pubId);
            }

            // reset the publication set visited to not save them again on persistence
            publicationData.clearVisitedPublicationSet();
        }

        // remove publication data folder not linked with preloaded.publication.db after migration
        const pubIdFromDisk = await diMainGet("publication-data").listPublication();
        const publicationIdNotInDatabase = pubIdFromDisk.filter((pubId) => !pubIdFromDatabase.includes(pubId));
        for (const pubId of publicationIdNotInDatabase) {
            const publicationData = diMainGet("publication-data");
            try {
                debug(`delete data folder=${pubId} on disk because not linked from publications database`);
                await publicationData.removePublication(pubId);
            } catch (e) {
                debug(`${e}`);
            }
        }

        debug("END reader registry migration, let's create the redux store");
    } else {

        const winRegistryEnabled = false; // win.registry is removed and replaced by publication data stored on disk and redux win.session to keep references on reader/library windows
        if (winRegistryEnabled) {
            debug("START reader registry hydration from publication-data (win.registry.reader is empty from the json state \"state_v340.json\" or from an empty new \"state.json\")");
            if (!preloadedState.win) {
                preloadedState.win = {} as any;
            }
            if (!preloadedState.win.registry) {
                preloadedState.win.registry = {} as any;
            }
            if (!preloadedState.win.registry.reader) {
                preloadedState.win.registry.reader = {};
            }
    
            // list publication db
            // read publication-data files and hydrate redux state
            const publicationData = diMainGet("publication-data");
            const pubIds = await publicationData.listPublication();
            for (const pubId of pubIds) {
                debug("PubID", pubId);
                preloadedState.win.registry.reader[pubId] = {} as IWinRegistryReaderState;
    
                // "config" | "locator" | "divina" | "disableRTLFlip" | "allowCustomConfig" | "noteTotalCount" | "pdfConfig"
    
                // can be undefined!
                const locator = await tryCatch(async () => await publicationData.readJsonObj(pubId, "locator"), _dbgn) as unknown as MiniLocatorExtended;
    
                // can be undefined!
                const config = await tryCatch(async () => await publicationData.readJsonObj(pubId, "config"), _dbgn) as unknown as ReaderConfig;
    
                // can be undefined!
                const disableRTLFlip = await tryCatch(async () => await publicationData.readJsonObj(pubId, "disableRTLFlip"), _dbgn) as unknown as IRTLFlipState;
    
                // can be undefined!
                const allowCustomConfig = await tryCatch(async () => await publicationData.readJsonObj(pubId, "allowCustomConfig"), _dbgn) as unknown as IAllowCustomConfigState;
    
                // can be undefined!
                const noteTotalCount = await tryCatch(async () => await publicationData.readJsonObj(pubId, "noteTotalCount"), _dbgn) as unknown as IBookmarkTotalCountState;
    
                // can be undefined!
                const divina = await tryCatch(async () => await publicationData.readJsonObj(pubId, "divina"), _dbgn) as unknown as IDivinaState;
    
                // can be undefined!
                const pdfConfig = await tryCatch(async () => await publicationData.readJsonObj(pubId, "pdfConfig"), _dbgn) as unknown as IReaderPdfConfig;
    
                preloadedState.win.registry.reader[pubId].reduxState = {
                    locator,
                    config,
                    disableRTLFlip,
                    allowCustomConfig,
                    noteTotalCount,
                    divina,
                    pdfConfig,
                };
    
                // can be undefined!
                const bound = await tryCatch(async () => await publicationData.readJsonObj(pubId, "bound"), _dbgn);
    
                preloadedState.win.registry.reader[pubId].windowBound = bound as unknown as Electron.Rectangle;
    
                debug(`\t => reduxState loaded with ${!!locator}, ${!!config}, ${!disableRTLFlip}, ${!!bound}`);
                try {
                    await publicationData.close(pubId);
                } catch (e) {
                    debug(e);
                }
            }
    
            debug("END reader registry hydration from publication-data, let's create the redux store");
        } // win registry hydration disabled
        else {
            // apply to the win registry reader state the previous persisted state for the 330 backward compatibility (from state.json and not state_v340.json)
            preloadedState.win.registry.reader = reduxStateWinRegistryReader || {};
            const readerRegistryPubIds = Object.keys(preloadedState.win.registry.reader);

            const diskPubIds = await diMainGet("publication-data").listPublication();
            const isBijective = diskPubIds.length === readerRegistryPubIds.length &&
                diskPubIds.every((pubId) => readerRegistryPubIds.includes(pubId));
            if (isBijective) {
                debug("OK! Consistency check passed: win.registry.reader matches the publication identifiers on disk");
            } else {
                debug("Failed! Consistency check failed: win.registry.reader does not match publication identifiers on disk. Rewriting Redux state");
                preloadedState.win.registry.reader = await convertPublicationToRegistryReaderState(diskPubIds);
            }

        }
    }

    // defaultConfig state initialization from older database thorium version 2.x, 3.0
    if (preloadedState?.reader?.defaultConfig) {
        preloadedState.reader.defaultConfig = { ...readerConfigInitialState, ...preloadedState.reader.defaultConfig };
    }

    if (preloadedState?.creator && !preloadedState.creator.urn) {
        preloadedState.creator.urn = `urn:uuid:${preloadedState.creator.id}`;
    }

    if (preloadedState?.settings?.lcpAutoDeleteExpiredPublicationsForced) {
        // The shared-computer command-line override is process-local and must not be restored from disk.
        preloadedState.settings = {
            ...preloadedState.settings,
            lcpAutoDeleteExpiredPublicationsForced: false,
        };
    }

    if ((preloadedState as any)?.annotationImportQueue) {
        // How to deal with the annotationImportQueue migration ?
        // A wise decision will be to merge INotePreState to InoteState readerState.note
        // But it is really necessary, the probability that the user upgrade thorium during an annotations import is pretty low ! Isn't it ?

        // (preloadedState as any).annotationImportQueue = undefined;
    }

    if (Array.isArray(preloadedState?.customization?.history) && preloadedState.customization.history.some(({ version }) => typeof version === "string")) {
        debug("dev data migration from version (semanticVersionning) to date-time (epoch timestamp) created/modified");
        preloadedState.customization.history = preloadedState.customization.history.filter(({ version }) => typeof version === "number");
    }

    // initLockInfo
    if (preloadedState?.customization?.lock) {
        preloadedState.customization.lock = {
            state: "IDLE",
            lockInfo: {
                uuid: "",
            },
        };
    }

    const sagaMiddleware = createSagaMiddleware();

    const mware = applyMiddleware(
        reduxSyncMiddleware,
        sagaMiddleware,
        reduxPersistMiddleware,
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
    const middleware = __TH__IS_DEV__ ? require("remote-redux-devtools").composeWithDevTools(
        {
            port: REDUX_REMOTE_DEVTOOLS_PORT,
        },
    )(mware) : mware;

    const store = createStore(
        rootReducer,
        preloadedState as {},
        middleware,
    );

    // Detached promise
    Promise.resolve()
        .then(async () => {
            await persistStateToFs(store.getState(), runtimeStateFilePath);
            debug("COPY", runtimeStateFilePath, "TO", stateFilePath);
            await fs.promises.copyFile(runtimeStateFilePath, stateFilePath);
            debug("rm -rf", patchFilePath);
            await rmrf(patchFilePath);
        }).catch(e => {
            debug(`Failed: ${e}`);
        });

    // Redux Saga main entry point
    // Starting the Application
    sagaMiddleware.run(rootSaga).toPromise()
        .then(() => {
            debug("Application started!");
        })
        .catch((e) => error("main/memory", e));

    return [store, sagaMiddleware];
}
