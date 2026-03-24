// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import { deepStrictEqual, ok } from "readium-desktop/common/utils/assert";
import {
    diMainGet, memoryLoggerFilename, patchFilePath, runtimeStateFilePath, state_V340_FilePath, stateFilePath,
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
import { IWinRegistryReaderState } from "readium-desktop/main/redux/states/win/registry/reader";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { IRTLFlipState } from "readium-desktop/common/redux/states/renderer/rtlFlip";
import { IAllowCustomConfigState } from "readium-desktop/common/redux/states/renderer/allowCustom";
import { IDivinaState } from "readium-desktop/common/redux/states/renderer/divina";
import { IBookmarkTotalCountState } from "readium-desktop/common/redux/states/renderer/bookmarkTotalCount";
import { persistStateToFs } from "../sagas/persist";

// import { composeWithDevTools } from "remote-redux-devtools";
const REDUX_REMOTE_DEVTOOLS_PORT = 7770;

const _dbgn = "readium-desktop:main:store:memory";
const debugStdout = debug_(_dbgn);
// Logger
const debug = (...a: Parameters<debug_.Debugger>) => {
    debugStdout(...a);
    tryCatchSync(() =>
        fs.appendFileSync(memoryLoggerFilename, a.map((v) => `${+new Date()} ${JSON.stringify(v)}`).join("\n") + "\n"),
        "",
    );
};

const checkReduxState = async (runtimeState: object, reduxState: PersistRootState) => {

    deepStrictEqual(runtimeState, reduxState);

    debug("hydration state is certified compliant");

    return reduxState;
};

const runtimeState = async (): Promise<object> => {
    const runtimeStateStr = await tryCatch(() => fs.promises.readFile(runtimeStateFilePath, { encoding: "utf8" }), "");
    const runtimeState = await tryCatch(() => JSON.parse(runtimeStateStr), "");

    ok(typeof runtimeState === "object");

    return runtimeState;
};

const recoveryReduxState = async (runtimeState: object): Promise<object> => {

    const patchFileStrRaw = await tryCatch(() => fs.promises.readFile(patchFilePath, { encoding: "utf8" }), "");
    const patchFileStr = "[" + patchFileStrRaw.slice(0, -2) + "]"; // remove the last comma
    const patch = await tryCatch(() => JSON.parse(patchFileStr), "");

    ok(Array.isArray(patch));

    // RangeError: Maximum call stack size exceeded
    // diffAny
    // node_modules/rfc6902/diff.js:262:17
    // dist
    // node_modules/rfc6902/diff.js:135:36
    try {
        const errors = applyPatch(runtimeState, patch);
        ok(errors.reduce((pv, cv) => pv && !cv, true));
    } catch (err) {
        console.log(err);
    }

    ok(typeof runtimeState === "object", "state not defined after patch");

    return runtimeState;
};

const test = (stateRaw: any): stateRaw is PersistRootState => {
    ok(typeof stateRaw === "object");
    ok(stateRaw.win);
    ok(stateRaw.publication);
    ok(stateRaw.reader);
    ok(stateRaw.session);

    return stateRaw;
};

export async function initStore()
    : Promise<[Store<RootState>, SagaMiddleware<object>]> {

    let reduxState: PersistRootState | undefined = undefined;

    debug("");
    debug("MEMORY INIT STORE");


    // See PR for the forward and backward migration v3.3 <-> v3.4
    // https://github.com/edrlab/thorium-reader/pull/3423

    try {

        let jsonStr = "";
        let getNewStateFromV340 = false;
        try {
            jsonStr = await fs.promises.readFile(stateFilePath, { encoding: "utf8" });
            const json = JSON.parse(jsonStr);
            if (json.__t && json.__v) {
                debug("The old one: \"state.json\" was written with the v3.4.0 last release and not from an old one (like v3.3.0), so let's recover the json redux state from \"state_v340.json\"");
                getNewStateFromV340 = true;
            } else {
                // the old state.json has been updated from an older thorium version (3.3.0?) so let's migrate from it.
                debug("If there is a crash from v330 and a forward migration to v340, publications data will not be imported, state.json will not be updated with new publications state");
                getNewStateFromV340 = false;
            }
        } catch (e) {
            debug("read/parse old state crash so let's read new state v340", `${e}`);
            getNewStateFromV340 = true;
        }

        if (getNewStateFromV340) {
            try {
                jsonStr = await fs.promises.readFile(state_V340_FilePath, { encoding: "utf8" });
            } catch (e) {
                debug("NEW state_v340.json not created so fallback on state.json", `${e}`);
            }
        } else {
            debug("state is loaded from \"state.json\" and not \"state_v340.json\"");
        }

        const json = JSON.parse(jsonStr);
        if (test(json))
            reduxState = json;

        debug("STATE LOADED FROM FS");
        debug("😍😍😍😍😍😍😍😍");

    } catch {
        reduxState = undefined;
    }

    try {

        debug("BE CAREFUL");
        debug("State initialisation on the first and second launch of Thorium");
        debug("On the first launch runtimeStatePath failed it's an empty file (not created)");
        debug("On the second launch runtimeStatePath is equal to an empty object {}");
        debug("and failed on checkReduxState, reduxState has not be preloaded in runtimeStateFilePath");
        debug("So the Third launch is good!, Thorium State is stabilize");
        const state = await recoveryReduxState(await runtimeState());
        reduxState = await checkReduxState(state, reduxState);

        debug("RECOVERY WORKS lvl 1/4");
    } catch (e) {

        debug("N-1 STATE + PATCH != STATE");
        debug("Your state is probably corrupted");
        debug("If it is a fresh thorium installation do not worry");
        debug("If it is a migration from Thorium 1.6 to Thorium 1.7 do not worry too, migrtion process will start");
        debug(e);

        try {

            test(reduxState);

            debug("RECOVERY : the state is provided from potentially corrupted state.json file");
            debug("the last state.json seems good after a quick test on it !");
            debug("state - 1 + patch is not used");
            debug("recovery state come from state.json");
            debug("REVOVERY WORKS lvl 2/4");
        } catch {
            try {

                const stateRawFirst = await runtimeState();
                test(stateRawFirst);
                const stateRaw: any = await recoveryReduxState(stateRawFirst);
                test(stateRaw);
                reduxState = stateRaw;

                // From the 3.4.0 and backward to 3.3.0: this leads to potentially a lost of data

                debug("RECOVERY : the state is provided from the state - 1 + patch");
                debug("There should be no data loss");
                debug("REVOVERY WORKS lvl 3/4");

            } catch {
                try {

                    const stateRawFirst: any = await runtimeState();
                    test(stateRawFirst);
                    reduxState = stateRawFirst;

                    debug("RECOVERY : the state is the previous runtime snapshot");
                    debug("There should be data loss !");
                    debug("RECOVERY WORKS 4/4");
                } catch {

                    // do not erase reduxState for security purpose
                    // reduxState = undefined;
                    debug("REDUX STATE IS CORRUPTED THE TEST FAILED");
                    debug("For security purpose the state is not erase");
                    debug("Be carefull, an unexpected behaviour may occur");
                    debug("RECOVERY FAILED none of the 4 recoveries mode worked");
                }

            }
        } finally {

            // let's comment the backup state option, not used and valid anymore, to progressively ditch the diff patch recovery option
            // If not commented every start of 3.4.0 lead to the copy of the current state, due to an un equality between the final state.json and state.runtime.json+patch
            // On the other hand, we can use this backup to find lost publication db state, from previous corrupted state.
            // This allows to match publication-storage and publication db from a lost state.
            // We need for the next release to do an automatic integrity check and cleaning

            // const p = backupStateFilePathFn();
            // await tryCatch(() =>
            //     fs.promises.writeFile(p, JSON.stringify(reduxState), { encoding: "utf8" }),
            //     "");

            // debug("RECOVERY : a state backup file is copied in " + p);
            // debug("keep it safe, you may restore a corrupted state with it");
        }

    } finally {

        await tryCatch(() =>
            fs.promises.writeFile(
                runtimeStateFilePath,
                reduxState ? JSON.stringify(reduxState) : "{}",
                { encoding: "utf8" },
            )
            , "");

        // the file doen't have a top array [...]
        // we need to add it before the parsing
        await tryCatch(() => fs.promises.writeFile(patchFilePath, "", { encoding: "utf8" }), "");
    }

    if (!reduxState) {
        debug("####### WARNING ######");
        debug("Thorium starts with a fresh new session");
        debug("There are no DATABASE on the filesystem");
        debug("####### WARNING ######");
    }

    debug("REDUX STATE VALUE :: ", typeof reduxState, reduxState ? Object.keys(reduxState) : "nil");
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

    if (preloadedState.win?.registry?.reader) {

        debug("START reader registry migration");

        let pubIds: string[];
        if (preloadedState?.publication?.db) {
            pubIds = Object.keys(preloadedState.publication.db);
        }

        for (const pubId in preloadedState.win.registry.reader) {
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

            if (pubIds.includes(pubId)) {
                debug("MIGRATION TO Publication-data file storage ->", pubId);

                // TODO: parallel !? libuv = 4 threads
                const publicationData = diMainGet("publication-data");
                const publicationStorage = diMainGet("publication-storage");

                if (state?.reduxState?.locator) {
                    debug("\t => locator");
                    const jsonObj = state.reduxState.locator as unknown as object;
                    try {
                        await publicationData.writeJsonObj(pubId, "locator", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
                    try {
                        await publicationStorage.writeJsonObj(pubId, "locator", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
                }
                if (state?.reduxState?.config) {
                    debug("\t => config");
                    const jsonObj = state.reduxState.config as unknown as object;
                    try {
                        await publicationData.writeJsonObj(pubId, "config", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
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
                    try {
                        await publicationData.writeJsonObj(pubId, "disableRTLFlip", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
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
                    try {
                        await publicationData.writeJsonObj(pubId, "divina", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
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
                    try {
                        await publicationData.writeJsonObj(pubId, "allowCustomConfig", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
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
                    try {
                        await publicationData.writeJsonObj(pubId, "noteTotalCount", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
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
                    try {
                        await publicationData.writeJsonObj(pubId, "pdfConfig", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
                    // try {
                    //     await publicationStorage.writeJsonObj(pubId, "pdfConfig", jsonObj);
                    // } catch (e) {
                    //     debug(e);
                    // }
                }
                if (state?.windowBound) {
                    debug("\t => bound");
                    const jsonObj = state.windowBound as unknown as object;
                    try {
                        await publicationData.writeJsonObj(pubId, "bound", jsonObj);
                    } catch (e) {
                        debug(e);
                    }
                }

                try {
                    await publicationData.close(pubId);
                } catch (e) {
                    debug(e);
                }
            } else {
                debug("MIGRATION TO Publication-data file storage ->", pubId, "IMPOSSIBLE BECAUSE PUBID NOT FOUND IN publication.db !!!");
            }
        }

        try {
            await persistStateToFs(preloadedState);
            debug("state.json and state_v340.json written with the new migration final state");
        } catch (e) {
            debug(e);
            debug("ERROR to write state.json and state_v340.json on disk after migration !!!");
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
    }

    // defaultConfig state initialization from older database thorium version 2.x, 3.0
    if (preloadedState?.reader?.defaultConfig) {
        preloadedState.reader.defaultConfig = { ...readerConfigInitialState, ...preloadedState.reader.defaultConfig };
    }

    if (preloadedState?.creator && !preloadedState.creator.urn) {
        preloadedState.creator.urn = `urn:uuid:${preloadedState.creator.id}`;
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

    sagaMiddleware.run(rootSaga);

    return [store, sagaMiddleware];
}
