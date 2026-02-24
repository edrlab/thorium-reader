// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { readerIpc } from "readium-desktop/common/ipc";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { normalizeRectangle } from "readium-desktop/common/rectangle/window";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { deleteReaderWindowInDi, diMainGet, findReaderWindowFromPubIdDi, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { createReaderWindow } from "./browserWindow/createReaderWindow";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { comparePublisherReaderConfig } from "readium-desktop/common/publisherConfig";
import { readerActions } from "readium-desktop/common/redux/actions";
import { sqliteTableSelectAllNotesWherePubId } from "readium-desktop/main/db/sqlite/note";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:reader";
const debug = debug_(filename_);
debug("_");

const __readerWithSamePubIdGotTheLockMap = new Map<string, string>(); // K: pubId V: windowIdentifier

function* winOpen(action: winActions.reader.openSucess.TAction) {

    const { /*win,*/ winId, pubId } = action.payload;
    debug(`reader ${winId} -> winOpen`);

    const readerWin = action.payload.win;
    const webContents = readerWin.webContents;
    const screenReaderActivate = yield* selectTyped((_state: RootState) => _state.screenReader.activate);
    const locale = yield* selectTyped((_state: RootState) => _state.i18n.locale);
    // const reader = yield* selectTyped((_state: RootState) => _state.win.session.reader[identifier]);
    // const reader = {}; // read from file directory
    const readerDefaultConfig = yield* selectTyped((_state: RootState) => _state.reader.defaultConfig);
    const keyboard = yield* selectTyped((_state: RootState) => _state.keyboard);
    const mode = yield* selectTyped((state: RootState) => state.mode);
    const theme = yield* selectTyped((state: RootState) => state.theme);
    // const config = reader?.reduxState?.config || readerConfigInitialState;
    const config = {}; // read from config.json
    const transientConfigMerge = {...readerConfigInitialState, ...config};
    const creator = yield* selectTyped((_state: RootState) => _state.creator);
    const lcp = yield* selectTyped((state: RootState) => state.lcp);
    const noteExport = yield* selectTyped((state: RootState) => state.noteExport);
    const customization = yield* selectTyped((state: RootState) => state.customization);

    const publicationRepository = diMainGet("publication-repository");
    let tag: string[] = [];
    try {
        tag = yield* callTyped(() => publicationRepository.getAllTags());
    } catch {
        // ignore
    }


    let gotTheLock = false;
    const winIdGotTheLock = pubId ? __readerWithSamePubIdGotTheLockMap.get(pubId) : true;
    if (winIdGotTheLock) {
        gotTheLock = false;
        debug(`reader ${winId} did not get the lock`);
    } else {
        __readerWithSamePubIdGotTheLockMap.set(pubId, winId);
        gotTheLock = true;
        debug(`reader ${winId} got the lock !!!`);
    }

    const notes = pubId
        ? yield* callTyped(() => sqliteTableSelectAllNotesWherePubId(pubId))
        : [];

    webContents.send(readerIpc.CHANNEL, {
        type: readerIpc.EventType.request,
        payload: {
            screenReader: {
                activate: screenReaderActivate,
            },
            i18n: {
                locale,
            },
            win: {
                identifier: winId,
            },
            reader: {
                // TODO
                ...(reader?.reduxState || {}), // reader.reduxState is normally always defined but for security reason, I prefer to do not change this !!!
                // see issue https://github.com/edrlab/thorium-reader/issues/2532
                defaultConfig: {
                    ...readerDefaultConfig,
                    ttsVoices: [], // disable ttsVoice global preference for readium/speech lib
                    ttsVoice: null, // old key, need to migrate to ttsVoices 25/02/2025
                },
                transientConfig: {
                    font: transientConfigMerge.font,
                    fontSize: transientConfigMerge.fontSize,
                    pageMargins: transientConfigMerge.pageMargins,
                    wordSpacing: transientConfigMerge.wordSpacing,
                    letterSpacing: transientConfigMerge.letterSpacing,
                    paraSpacing: transientConfigMerge.paraSpacing,
                    lineHeight: transientConfigMerge.lineHeight,
                },
                allowCustomConfig: {
                    state: !comparePublisherReaderConfig(config, readerConfigInitialState),
                },
                config,
                lock: gotTheLock,
                note: notes,
                // disableRTLFlip: { disabled: false },
            },
            keyboard,
            mode,
            theme,
            creator,
            publication: {
                tag,
            },
            lcp,
            noteExport,
            customization,
        },
    } as readerIpc.EventPayload);
}

function* winClose(action: winActions.reader.closed.TAction) {

    const winId = action.payload.winId;
    debug(`reader ${winId} -> winClose`);
    const readerStateFromDi = getReaderWindowFromDi(winId);
    if (!readerStateFromDi) {
        debug("ERROR: WINID NOT FOUND !!!!!", winId);
        debug("WIN CLOSE NOT FINISHED");
        debug("ERROR!!!");
        return ;
    }
    const { win: readerWindow, pubId } = getReaderWindowFromDi(winId);
    deleteReaderWindowInDi(winId);

    const winIdGotTheLock = __readerWithSamePubIdGotTheLockMap.get(pubId);
    if (winId === winIdGotTheLock) {
        __readerWithSamePubIdGotTheLockMap.delete(pubId);
    }

    // const reduxState = reader.reduxState;

    // const notes = yield* callTyped(() => sqliteTableSelectAllNotesWherePubId(pubId));
    // reduxState.note = (notes && notes.length) ? notes : [];

    // TODO: persist data ?

    yield put(streamerActions.publicationCloseRequest.build(pubId));


    const readersWithSamePubId = findReaderWindowFromPubIdDi(pubId);

    const readerSamePubIdFirstWinId = readersWithSamePubId[0]?.winId;
    if (readerSamePubIdFirstWinId) {
        __readerWithSamePubIdGotTheLockMap.set(pubId, readerSamePubIdFirstWinId);
        yield put(readerActions.setTheLock.build(readerSamePubIdFirstWinId));
        debug(`reader ${readerSamePubIdFirstWinId} got the lock !!!`);
    }

    try {
        const libraryWin = yield* callTyped(() => getLibraryWindowFromDi());

        debug("Nb of readers:", readersWithSamePubId.length);
        debug("readers: ", readersWithSamePubId);
        if (readersWithSamePubId.length < 1) {

            const mode = yield* selectTyped((state: RootState) => state.mode);
            if (mode === ReaderMode.Detached) {

                // disabled for the new UI refactoring by choice of the designer
                // yield put(readerActions.attachModeRequest.build());

            } else {
                if (readerWindow && !readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) {
                    try {
                        const winBound = readerWindow.getBounds();
                        debug("_______3 readerWindow.getBounds()", winBound);
                        normalizeRectangle(winBound);

                        if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed()) {
                            libraryWin.setBounds(winBound);
                        }
                    } catch (e) {
                        debug("error libraryWindow.setBounds(readerWindow.getBounds())", e);
                    }
                }
            }
        }

        if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed()) {
            if (libraryWin.isMinimized()) {
                libraryWin.restore();
            } else if (!libraryWin.isVisible()) {
                libraryWin.close();
                return;
            }
            libraryWin.show(); // focuses as well
        }

    } catch (_err) {
        debug("can't load libraryWin from di");
    }

}

export function saga() {
    return all([
        takeSpawnEvery(
            winActions.reader.openRequest.ID,
            createReaderWindow,
            (e) => error(filename_ + ":createReaderWindow", e),
        ),
        takeSpawnEvery(
            winActions.reader.openSucess.ID,
            winOpen,
            (e) => error(filename_ + ":winOpen", e),
        ),
        takeSpawnEvery(
            winActions.reader.closed.ID,
            winClose,
            (e) => error(filename_ + ":winClose", e),
        ),
    ]);
}
