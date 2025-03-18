// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { appendFileSync, promises as fsp } from "fs";
import { deepStrictEqual, ok } from "readium-desktop/common/utils/assert";
import {
    backupStateFilePathFn, memoryLoggerFilename, patchFilePath, runtimeStateFilePath, stateFilePath,
} from "readium-desktop/main/di";
import { reduxSyncMiddleware } from "readium-desktop/main/redux/middleware/sync";
import { rootReducer } from "readium-desktop/main/redux/reducers";
import { rootSaga } from "readium-desktop/main/redux/sagas";
import { PersistRootState, RootState } from "readium-desktop/main/redux/states";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { tryCatch, tryCatchSync } from "readium-desktop/utils/tryCatch";
import { applyMiddleware, legacy_createStore as createStore, type Store } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";
import { applyPatch } from "rfc6902";

import { reduxPersistMiddleware } from "../middleware/persistence";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import { minimizeLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

// import { composeWithDevTools } from "remote-redux-devtools";
const REDUX_REMOTE_DEVTOOLS_PORT = 7770;

const debugStdout = debug_("readium-desktop:main:store:memory");
// Logger
const debug = (...a: Parameters<debug_.Debugger>) => {
    debugStdout(...a);
    tryCatchSync(() =>
        appendFileSync(memoryLoggerFilename, a.map((v) => `${+new Date()} ${JSON.stringify(v)}`).join("\n") + "\n"),
        "",
    );
};

const checkReduxState = async (runtimeState: object, reduxState: PersistRootState) => {

    deepStrictEqual(runtimeState, reduxState);

    debug("hydration state is certified compliant");

    return reduxState;
};

const runtimeState = async (): Promise<object> => {
    const runtimeStateStr = await tryCatch(() => fsp.readFile(runtimeStateFilePath, { encoding: "utf8" }), "");
    const runtimeState = await tryCatch(() => JSON.parse(runtimeStateStr), "");

    ok(typeof runtimeState === "object");

    return runtimeState;
};

const recoveryReduxState = async (runtimeState: object): Promise<object> => {

    const patchFileStrRaw = await tryCatch(() => fsp.readFile(patchFilePath, { encoding: "utf8" }), "");
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

    let reduxState: PersistRootState | undefined;

    debug("");
    debug("MEMORY INIT STORE");

    try {

        const jsonStr = await fsp.readFile(stateFilePath, { encoding: "utf8" });
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

            const p = backupStateFilePathFn();
            await tryCatch(() =>
                fsp.writeFile(p, JSON.stringify(reduxState), { encoding: "utf8" }),
                "");

            debug("RECOVERY : a state backup file is copied in " + p);
            debug("keep it safe, you may restore a corrupted state with it");
        }

    } finally {

        await tryCatch(() =>
            fsp.writeFile(
                runtimeStateFilePath,
                reduxState ? JSON.stringify(reduxState) : "{}",
                { encoding: "utf8" },
            )
            , "");

        // the file doen't have a top array [...]
        // we need to add it before the parsing
        await tryCatch(() => fsp.writeFile(patchFilePath, "", { encoding: "utf8" }), "");
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

    if (preloadedState.win?.registry?.reader) {
        for (const id in preloadedState.win.registry.reader) {
            const state = preloadedState.win.registry.reader[id];

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

            if (state?.reduxState?.annotation) {
                for (const annotation of state.reduxState.annotation) {
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

            if (state?.reduxState?.bookmark) {
                for (const bookmark of state.reduxState.bookmark) {
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
                }
            }
        }
    }

    // defaultConfig state initialization from older database thorium version 2.x, 3.0
    if (preloadedState?.reader?.defaultConfig) {
        preloadedState.reader.defaultConfig = { ...readerConfigInitialState, ...preloadedState.reader.defaultConfig };
    }

    const sagaMiddleware = createSagaMiddleware();

    const mware = applyMiddleware(
        reduxSyncMiddleware,
        sagaMiddleware,
        reduxPersistMiddleware,
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
    const middleware = IS_DEV ? require("remote-redux-devtools").composeWithDevTools(
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
