// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as fs from "fs";
import { ok } from "readium-desktop/common/utils/assert";
import {
    splashScreen,
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
import { app, BrowserWindow } from "electron";
import { error } from "readium-desktop/main/tools/error";

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

// const checkReduxState = async (runtimeState: object, reduxState: PersistRootState) => {

//     deepStrictEqual(runtimeState, reduxState);

//     debug("hydration state is certified compliant");

//     return reduxState;
// };

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
    // ok(stateRaw.session);

    return stateRaw;
};

export async function initStore()
    : Promise<[Store<RootState>, SagaMiddleware<object>]> {

    let reduxState: PersistRootState | undefined = undefined;

    let reduxStateFromState330: PersistRootState | undefined = undefined;

    debug("");
    debug("MEMORY INIT STORE");


    // See PR for the forward and backward migration v3.3 <-> v3.4
    // https://github.com/edrlab/thorium-reader/pull/3423

    try {

        let jsonStr = "";
        let getNewStateFromV340 = false;
        try {
            jsonStr = await fs.promises.readFile(stateFilePath, { encoding: "utf8" });
            reduxStateFromState330 = JSON.parse(jsonStr);
            //  __t and __v are the hacky keys inserted when persisted by 340
            if (test(reduxStateFromState330) && (reduxStateFromState330 as any).__t && (reduxStateFromState330 as any).__v) {
                debug("The old one: \"state.json\" was written with the v3.4.0 last release and not from an old one (like v3.3.0), so let's recover the json redux state from \"state_v340.json\"");
                getNewStateFromV340 = true;
            } else {
                reduxStateFromState330 = undefined;
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
        if (test(json)) {
            debug("REDUX STATE Assigned to the final persisted state");
            reduxState = json;
        }

        debug("STATE LOADED FROM FS");
        debug("😍😍😍😍😍😍😍😍");

    } catch {
        reduxState = undefined;
        debug("REDUX STATE is UNDEFINED could be the first start or missing/broken state");
    }

    try {

        try {
            test(reduxState);
            const reduxRecoveredState = await recoveryReduxState(reduxState);
            if (test(reduxRecoveredState)) {
                debug("REDUX STATE Assigned to the final persisted state AND with the diff patch reconstruction");
                reduxState = reduxRecoveredState;
            }
        } finally {
            test(reduxState);
            debug("REDUX STATE tested as a valid object; Let's start the application with this state");
        }
        // reduxState = await checkReduxState(state, reduxState);

    } catch {

        try {
            try {
                const reduxRuntimeState = await runtimeState();
                if (test(reduxRuntimeState)) {
                    debug("REDUX STATE Assigned to the runtime fist previous launch state");
                    reduxState = reduxRuntimeState;
                }
                const reduxRecoveredState = await recoveryReduxState(reduxState);
                if (test(reduxRecoveredState)) {
                    debug("REDUX STATE Assigned to the runtime fist previous launch state AND with the diff patch reconstruction");
                    reduxState = reduxRecoveredState;
                }
            } finally {
                test(reduxState);
                debug("REDUX STATE tested as a valid object; Let's start the application with this state");
            }
            // reduxState = await checkReduxState(state, reduxState);

            // From the 3.4.0 and backward to 3.3.0: this leads to potentially a lost of data


        } catch {

            debug("REDUX STATE CORRUPTED OR EMPTY");

            // try {

            //     const stateRawFirst: any = await runtimeState();
            //     test(stateRawFirst);
            //     reduxState = stateRawFirst;

            //     debug("RECOVERY : the state is the previous runtime snapshot");
            //     debug("There should be data loss !");
            //     debug("RECOVERY WORKS 4/4");
            // } catch {

            //     // do not erase reduxState for security purpose
            //     // reduxState = undefined;
            //     debug("REDUX STATE IS CORRUPTED THE TEST FAILED");
            //     debug("For security purpose the state is not erase");
            //     debug("Be carefull, an unexpected behaviour may occur");
            //     debug("RECOVERY FAILED none of the 4 recoveries mode worked");
            // }

        }
        // finally {

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
        // }

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
    const reduxStateIsUndefined = !reduxState;
    const preloadedState: Partial<PersistRootState> = reduxState ? {
        ...reduxState,
    } : {};

    // SQLITE
    sqliteInitialisation();
    sqliteInitTableNote();

    if (preloadedState.win?.registry?.reader) {

        debug("START reader registry migration");

        let pubIds: string[] = [];
        if (preloadedState?.publication?.db) {
            pubIds = Object.keys(preloadedState.publication.db);
        }
        const readerRegistryPubIds = Object.keys(preloadedState.win.registry.reader);
        const numberOfPublicationNeededToDisplayTheSplashScreen = 20; // between 20 and 50 seems to me a good compromise, 500ms to 1s minimum before showing the splash-screen
        if (readerRegistryPubIds.length > numberOfPublicationNeededToDisplayTheSplashScreen) {
            // Create splash window
            app.whenReady().then(() => {

                try {
                    splashScreen.browserWindow = new BrowserWindow({
                        width: 400,
                        height: 300,
                        frame: false,
                        alwaysOnTop: true,
                        transparent: true,
                    });

                    const splashHTML = `
<!DOCTYPE html>
<html>
<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#ffffff;color:#000000;">
  <div style="text-align:center">
    <div style="
      width:40px;
      height:40px;
      border:4px solid #ccc;
      border-top:4px solid #09f;
      border-radius:50%;
      animation:spin 1s linear infinite;
      margin:auto;
    "></div>
    <p>The migration of Thorium-Reader Desktop to version 3.4 is in progress. Please wait...</p>
  </div>

  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</body>
</html>
`;
                    const splashDataURL = `data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`;
                    splashScreen.browserWindow.loadURL(splashDataURL);
                } catch { }
            });
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

            const publicationData = diMainGet("publication-data");
            if (pubIds.includes(pubId)) {
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
                debug("MIGRATION TO Publication-data file storage ->", pubId, "NOT POSSIBLE BECAUSE PUBID NOT FOUND IN publication.db !!!");
            }

            // reset the publication set visited to not save them again on persistence
            publicationData.clearVisitedPublicationSet();
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

        // no state registry reader found

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
            if (!preloadedState.win) {
                preloadedState.win = {} as any;
            }
            if (!preloadedState.win.registry) {
                preloadedState.win.registry = {} as any;
            }
            if (!preloadedState.win.registry.reader) {
                preloadedState.win.registry.reader = {};
            }

            // apply to the win registry reader state the previous persisted state for the 330 backward compatibility (from state.json and not state_v340.json)
            preloadedState.win.registry.reader = reduxStateFromState330?.win?.registry?.reader || {};
        }
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


    // If this is the first application start (runtime state does not match persisted Redux state),
    // initialize the final redux persisted state using the default values from the Redux reducers.
    // same as app closing persistence
    if (reduxStateIsUndefined) {
        debug("First start of the app or corrupted/missing state; persist/write the default redux state from the Redux reducers to initialize it");
        try {
            await persistStateToFs(store.getState());
        } catch (e) {
            debug("Failed to persist the first Redux State to Disk before starting the application");
            debug(e);
        }
    } else {
        debug("Starting the app with the persisted state");
    }

    // Redux Saga main entry point
    // Starting the Application
    sagaMiddleware.run(rootSaga).toPromise()
        .then(() => {
            debug("Application started!");
        })
        .catch((e) => error("main/memory", e));

    return [store, sagaMiddleware];
}
