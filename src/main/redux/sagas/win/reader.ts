// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { readerIpc } from "readium-desktop/common/ipc";
import { ReaderInfo, ReaderMode } from "readium-desktop/common/models/reader";
import { normalizeWinBoundRectangle } from "readium-desktop/common/rectangle/window";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { deleteReaderWindowInDi, diMainGet, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
// import { comparePublisherReaderConfig } from "readium-desktop/common/publisherConfig";
import { readerActions } from "readium-desktop/common/redux/actions";
import { sqliteTableSelectAllNotesWherePubId } from "readium-desktop/main/db/sqlite/note";
import { IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { dialog } from "electron";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:reader";
const debug = debug_(filename_);
debug("_");

const __readerWithSamePubIdGotTheLockMap = new Map<string, string>(); // K: publicationIdentifier V: windowIdentifier

// event receive when reader window.webcontent send 'did-finish-load'
function* winOpen(action: winActions.reader.openSucess.TAction) {

    const { readerWindow, publicationIdentifier: pubId, windowIdentifier: winId } = action.payload;
    debug(`reader winId=${winId} -> winOpen pubId=${pubId}`);

    if (readerWindow.isDestroyed()) {
        debug("readerWindow distroyed -> exit on winId=${winId} -> pubId=${pubId}");
        return ;
    }
    const webContents = readerWindow.webContents;
    const screenReaderActivate = yield* selectTyped((_state: RootState) => _state.screenReader.activate);
    const locale = yield* selectTyped((_state: RootState) => _state.i18n.locale);
    const readerSession = yield* selectTyped((_state: RootState) => _state.win.session.reader[winId]);
    
    // registry.reader disabled, reducers disabled
    // const readerRegistry = yield* selectTyped((_state: RootState) => _state.win.registry.reader[winId])

    const readerDefaultConfig = yield* selectTyped((_state: RootState) => _state.reader.defaultConfig);
    const config = { ...readerDefaultConfig, ...(pubId ? yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "config")) : {}) };
    const locator = (yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "locator"))) || undefined; // TODO: type object and not locator
    const disableRTLFlip = (yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "disableRTLFlip"))) || undefined; // TODO: type object and not disableRTLFlip
    const divina = (yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "divina"))) || undefined; // TODO: type object and note IDivinaState
    const noteTotalCount = (yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "noteTotalCount"))) || undefined; // TODO: type object
    const pdfConfig = (yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "pdfConfig"))) || undefined; // TODO: type object
    
    // not used by default, no need to persist 
    const allowCustomConfig = pubId ? yield* callTyped(() => diMainGet("publication-data").readJsonObj(pubId, "allowCustomConfig")) : undefined; // TODO: type object

    const keyboard = yield* selectTyped((_state: RootState) => _state.keyboard);
    const mode = yield* selectTyped((state: RootState) => state.mode);
    const theme = yield* selectTyped((state: RootState) => state.theme);
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
    const winIdGotTheLock = pubId
        ? __readerWithSamePubIdGotTheLockMap.get(pubId)
        : true;
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

    if (readerWindow.isDestroyed() || readerWindow.webContents.isDestroyed()) {
        debug("readerWindow or webcontents distroyed -> exit on winId=${winId} -> pubId=${pubId}");
        return ;
    }
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
                // hydration from reader session disabled
                // ...(reader?.reduxState || {}), // reader.reduxState is normally always defined but for security reason, I prefer to do not change this !!!
                locator,
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
                allowCustomConfig,
                // allowCustomConfig: {
                //     state: !comparePublisherReaderConfig(config, readerConfigInitialState),
                // },
                config,
                lock: gotTheLock,
                note: notes,
                disableRTLFlip: disableRTLFlip,
                info: {
                    filesystemPath: readerSession.reduxState.info.filesystemPath,
                    manifestUrlHttp: readerSession.reduxState.info.manifestUrlHttp,
                    manifestUrlR2Protocol: readerSession.reduxState.info.manifestUrlR2Protocol,
                    publicationIdentifier: readerSession.publicationIdentifier,
                    r2Publication: undefined, // see registerReader.ts and index_reader.ts hydration
                    publicationView: readerSession.reduxState.info.publicationView,
                    navigator: undefined, // see registerReader.ts and index_reader.ts
                } as ReaderInfo,
                highlight: undefined, // reader runtime state 
                divina: divina,
                tts: undefined, // reader runtime state
                mediaOverlay: undefined, // reader runtime state
                noteTotalCount: noteTotalCount,
                pdfConfig: pdfConfig,
            } as IReaderStateReader,
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

function* winOpenError(action: winActions.reader.openError.TAction) {
    const { readerWindow, publicationIdentifier: pubId, windowIdentifier: winId, reason } = action.payload;
    debug(`ERRROR!!! reader winId=${winId} -> pubId=${pubId} failed to open`);

    try {
        if (!readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) {
            yield* callTyped(() => dialog.showMessageBox(readerWindow, { type: "error", title: "Failed to initialize the reader", message: `CRITICAL ERRROR!!! winId=${winId}; pubId=${pubId}; Failed to initialize the reader; it will now close. [${reason}]`}));
        }
    } catch (e) {
        debug(e);
    }

    yield put(readerActions.closeRequest.build(winId, pubId));
}

export function* winClose(windowIdentifier: string, publicationIdentifier: string) {

    debug(`reader windId=${windowIdentifier} -> winClose pubId=${publicationIdentifier}`);
    const readersBeforeUnregistered = yield* selectTyped((state: RootState) => state.win.session.reader);
    if (!readersBeforeUnregistered[windowIdentifier]) {
        debug("ERROR: reader not found in the session list");
        // return; // continue to clean this broken state
    }
    deleteReaderWindowInDi(windowIdentifier);
    const winIdGotTheLock = __readerWithSamePubIdGotTheLockMap.get(publicationIdentifier);
    if (windowIdentifier === winIdGotTheLock) {
        __readerWithSamePubIdGotTheLockMap.delete(publicationIdentifier);
    }
    yield put(winActions.session.unregisterReader.build(windowIdentifier));
    yield put(streamerActions.publicationCloseRequest.build(publicationIdentifier));

    // readers in session updated
    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);

    {
        const readersArray = ObjectValues(readers);
        const readersWithSamePubId = readersArray.filter(({publicationIdentifier: pubIdFromOtherReader}) => publicationIdentifier === pubIdFromOtherReader);
        const readerSamePubIdFirstWinId = readersWithSamePubId[0]?.identifier;
        if (readerSamePubIdFirstWinId) {
            __readerWithSamePubIdGotTheLockMap.set(publicationIdentifier, readerSamePubIdFirstWinId);
            yield put(readerActions.setTheLock.build(readerSamePubIdFirstWinId));
            debug(`reader ${readerSamePubIdFirstWinId} got the lock !!!`);
        }

        try {
            const libraryWin = yield* callTyped(() => getLibraryWindowFromDi());

            debug("Nb of readers:", readersArray.length);
            debug("readers: ", readersArray);
            if (readersArray.length < 1) {

                const mode = yield* selectTyped((state: RootState) => state.mode);
                if (mode === ReaderMode.Detached) {

                    // disabled for the new UI refactoring by choice of the designer
                    // yield put(readerActions.attachModeRequest.build());

                } else {
                    const readerWin = yield* callTyped(() => getReaderWindowFromDi(windowIdentifier));
                    if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {
                        try {
                            let winBound = readerWin.getBounds();
                            debug("_______3 readerWin.getBounds()", winBound);
                            winBound = normalizeWinBoundRectangle(winBound);

                            if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed()) {
                                libraryWin.setBounds(winBound);
                            }
                        } catch (e) {
                            debug("error libraryWindow.setBounds(readerWin.getBounds())", e);
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

    {
        const readersSamePubId = Object.values(readers).filter((v) => v.publicationIdentifier === publicationIdentifier);
        if (readersSamePubId.length) {
            debug(`the reader with pubId=${publicationIdentifier} is not the last, ${readersSamePubId.length} remain(s) with the same publication identifier`);
            return;
        }

        // TODO: parallelize with Promise.allSettled
        // {
        //     const jsonObj = diMainGet("publication-data").getJsonObj(publicationIdentifier, "locator");
        //     if (jsonObj) {
        //         // finally save locator next to publication storage vault
        //         yield* callTyped(() => diMainGet("publication-storage").writeJsonObj(publicationIdentifier, "locator", jsonObj));
        //     }
        // }

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
        yield* callTyped(() => diMainGet("publication-data").close(publicationIdentifier));
    }
}

export function saga() {
    return all([
        takeSpawnEvery(
            winActions.reader.openSucess.ID,
            winOpen,
            (e) => error(filename_ + ":winOpen", e),
        ),
        takeSpawnEvery(
            winActions.reader.openError.ID,
            winOpenError,
            (e) => error(filename_ + ":winOpen", e),
        ),
        // takeSpawnEvery(
        //     winActions.reader.closed.ID,
        //     winClose,
        //     (e) => error(filename_ + ":winClose", e),
        // ),
    ]);
}
