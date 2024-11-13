// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { readerIpc } from "readium-desktop/common/ipc";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { normalizeRectangle } from "readium-desktop/common/rectangle/window";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { diMainGet, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put } from "redux-saga/effects";
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";

import { createReaderWindow } from "./browserWindow/createReaderWindow";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { comparePublisherReaderConfig } from "readium-desktop/common/publisherConfig";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:win:reader";
const debug = debug_(filename_);
debug("_");

function* winOpen(action: winActions.reader.openSucess.TAction) {

    const identifier = action.payload.identifier;
    debug(`reader ${identifier} -> winOpen`);

    const readerWin = action.payload.win;
    const webContents = readerWin.webContents;
    const locale = yield* selectTyped((_state: RootState) => _state.i18n.locale);
    const reader = yield* selectTyped((_state: RootState) => _state.win.session.reader[identifier]);
    const readerDefaultConfig = yield* selectTyped((_state: RootState) => _state.reader.defaultConfig);
    const keyboard = yield* selectTyped((_state: RootState) => _state.keyboard);
    const mode = yield* selectTyped((state: RootState) => state.mode);
    const theme = yield* selectTyped((state: RootState) => state.theme);
    const config = reader?.reduxState?.config || readerConfigInitialState;
    const transientConfigMerge = {...readerConfigInitialState, ...config};
    const creator = yield* selectTyped((_state: RootState) => _state.creator);

    const publicationRepository = diMainGet("publication-repository");
    let tag: string[] = [];
    try {
        tag = yield* callTyped(() => publicationRepository.getAllTags());
    } catch {
        // ignore
    }

    webContents.send(readerIpc.CHANNEL, {
        type: readerIpc.EventType.request,
        payload: {
            i18n: {
                locale,
            },
            win: {
                identifier,
            },
            reader: {
                ...reader?.reduxState || {},
                // see issue https://github.com/edrlab/thorium-reader/issues/2532
                defaultConfig: readerDefaultConfig,
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
            },
            keyboard,
            mode,
            theme,
            creator,
            publication: {
                tag,
            },
        },
    } as readerIpc.EventPayload);
}

function* winClose(action: winActions.reader.closed.TAction) {

    const identifier = action.payload.identifier;
    debug(`reader ${identifier} -> winClose`);

    {
        const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
        const reader = readers[identifier];

        if (reader) {

            yield put(winActions.session.unregisterReader.build(identifier));

            yield put(winActions.registry.registerReaderPublication.build(
                reader.publicationIdentifier,
                reader.windowBound,
                reader.reduxState),
                );

            yield put(streamerActions.publicationCloseRequest.build(reader.publicationIdentifier));
        }
    }

    {
        // readers in session updated
        const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
        const readersArray = ObjectValues(readers);

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
                    const readerWin = yield* callTyped(() => getReaderWindowFromDi(identifier));
                    if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {
                        try {
                            const winBound = readerWin.getBounds();
                            debug("_______3 readerWin.getBounds()", winBound);
                            normalizeRectangle(winBound);

                            if (libraryWin && !libraryWin.isDestroyed() && !libraryWin.webContents.isDestroyed())
                                libraryWin.setBounds(winBound);
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
