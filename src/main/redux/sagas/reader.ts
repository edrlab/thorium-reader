// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { screen } from "electron";
import * as ramda from "ramda";
import { error } from "readium-desktop/common/error";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { SenderType } from "readium-desktop/common/models/sync";
import { readerActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped } from "readium-desktop/common/redux/typed-saga";
import { getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH,
} from "readium-desktop/preprocessor-directives";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
import { all, call, put, take, takeEvery, takeLeading } from "redux-saga/effects";

import { streamerOpenPublicationAndReturnManifestUrl } from "./streamer";

// Logger
const filename_ = "readium-desktop:main:saga:reader";
const debug = debug_(filename_);
debug("_");

// const READER_CONFIG_ID = "reader";

// export function* readerConfigSetRequestWatcher(): SagaIterator {
//     while (true) {
//         // Wait for save request
//         const action = yield* takeTyped(readerActions.configSetRequest.build);

//         const configValue = action.payload.config;
//         const config: Omit<ConfigDocument<ReaderConfig>, keyof Timestampable> = {
//             identifier: READER_CONFIG_ID,
//             value: configValue,
//         };

//         // Get reader settings
//         const configRepository: ConfigRepository<ReaderConfig> = diMainGet("config-repository");

//         try {
//             yield call(() => configRepository.save(config));
//             yield put(readerActions.configSetSuccess.build(configValue));
//         } catch (error) {
//             yield put(readerActions.configSetError.build(error));
//         }
//     }
// }

// export function* readerConfigInitWatcher(): SagaIterator {
//     // Wait for app initialization
//     yield take(appActions.initSuccess.ID);

//     const configRepository: ConfigRepository<ReaderConfig> = diMainGet("config-repository");

//     try {
//         const readerConfigDoc = yield* callTyped(() => configRepository.get(READER_CONFIG_ID));

//         // Returns the first reader configuration available in database
//         yield put(readerActions.configSetSuccess.build(readerConfigDoc.value));
//     } catch (error) {
//         yield put(readerActions.configSetError.build(error));
//     }
// }

// export function* readerBookmarkSaveRequestWatcher(): SagaIterator {
//     while (true) {
//         // Wait for app initialization
//         // tslint:disable-next-line: max-line-length
//         const action = yield* takeTyped(readerActions.saveBookmarkRequest.build);

//         const bookmark = action.payload.bookmark;

//         // Get bookmark manager
//         const locatorRepository = diMainGet("locator-repository");

//         try {
//             const locator: ExcludeTimestampableWithPartialIdentifiable<LocatorDocument> = {
//                 // name: "",
//                 locator: {
//                     href: bookmark.docHref,
//                     locations: {
//                         cssSelector: bookmark.docSelector,
//                     },
//                 },
//                 publicationIdentifier: bookmark.publicationIdentifier,
//                 locatorType: LocatorType.LastReadingLocation,
//             };
//             yield call(() => locatorRepository.save(locator));
//             yield put(readerActions.saveBookmarkSuccess.build(bookmark));
//         } catch (error) {
//             yield put(readerActions.saveBookmarkError.build(error));
//         }
//     }
// }

function* readerFullscreenRequest(action: readerActions.fullScreenRequest.TAction) {

    const sender = action.sender;

    if (sender.identifier && sender.type === SenderType.Renderer) {

        const readerWin = yield* callTyped(() => getReaderWindowFromDi(sender.identifier));
        if (readerWin) {
            readerWin.setFullScreen(action.payload.full);
        }
    }
}

function* readerDetachRequest(action: readerActions.detachModeRequest.TAction) {

    const readerWinId = action.sender?.type === SenderType.Renderer && action.sender?.identifier;
    const readerWin = readerWinId && getReaderWindowFromDi(readerWinId);

    const libWin = yield* callTyped(() => getLibraryWindowFromDi());

    if (libWin) {

        const libBound = yield* callTyped(getWinBound, undefined);
        libWin.setBounds(libBound);

        // this should never occur, but let's do it for certainty
        if (libWin.isMinimized()) {
            libWin.restore();
        }
        libWin.show(); // focuses as well
    }

    if (readerWin) {

        // this should never occur, but let's do it for certainty
        if (readerWin.isMinimized()) {
            readerWin.restore();
        }
        readerWin.show(); // focuses as well
    }

    yield put(readerActions.detachModeSuccess.build());
}

function* getWinBound(publicationIdentifier: string) {

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
    const library = yield* selectTyped((state: RootState) => state.win.session.library);
    const readerArray = ObjectValues(readers);

    if (readerArray.length === 0) {
        return library.windowBound;
    }

    let winBound = yield* selectTyped(
        (state: RootState) => state.win.registry.reader[publicationIdentifier]?.windowBound,
    );

    const winBoundArray = [];
    winBoundArray.push(library.windowBound);
    readerArray.forEach(
        (reader) => reader && winBoundArray.push(reader.windowBound));
    const winBoundAlreadyTaken = !!winBoundArray.find((bound) => ramda.equals(winBound, bound));

    if (
        !winBound
        || winBoundAlreadyTaken
    ) {

        if (readerArray.length) {

            const displayArea = yield* callTyped(() => screen.getPrimaryDisplay().workAreaSize);

            const winBoundWithOffset = winBoundArray.map(
                (reader) => {
                    reader.x += 100;
                    reader.x %= displayArea.width - reader.width;
                    reader.y += 100;
                    reader.y %= displayArea.height - reader.height;

                    return reader;
                },
            );

            winBound = ramda.uniq(winBoundWithOffset)[0];

        } else {
            winBound = library.windowBound;
        }
    }

    return winBound;
}

function* readerOpenRequest(action: readerActions.openRequest.TAction) {

    debug(`readerOpenRequest:action:${JSON.stringify(action)}`);

    const publicationIdentifier = action.payload.publicationIdentifier;
    let manifestUrl: string;
    try {

        manifestUrl = yield* callTyped(streamerOpenPublicationAndReturnManifestUrl, publicationIdentifier);
    } catch (err) {

        // a toast message is dispalyed inside fct

    }

    if (manifestUrl) {

        const reduxState = yield* selectTyped(
            (state: RootState) => state.win.registry.reader[publicationIdentifier]?.reduxState,
        );

        const winBound = yield* callTyped(getWinBound, publicationIdentifier);

        // const readers = yield* selectTyped(
        //     (state: RootState) => state.win.session.reader,
        // );
        // const readersArray = ObjectValues(readers);

        const mode = yield* selectTyped((state: RootState) => state.mode);
        if (mode === ReaderMode.Attached) {
            try {
                getLibraryWindowFromDi().hide();
            } catch (_err) {
                debug("library can't be loaded from di");
            }
        }

        yield put(winActions.reader.openRequest.build(
            publicationIdentifier,
            manifestUrl,
            winBound,
            reduxState,
        ));

    }
}

function* readerCloseRequestFromPublication(action: readerActions.closeRequestFromPublication.TAction) {

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);

    for (const key in readers) {
        if (readers[key]?.publicationIdentifier === action.payload.publicationIdentifier) {
            yield call(readerCloseRequest, readers[key].identifier);
        }
    }
}

function* readerCLoseRequestFromIdentifier(action: readerActions.closeRequest.TAction) {
    yield call(readerCloseRequest, action.sender.identifier);

    const libWin: Electron.BrowserWindow = yield callTyped(() => getLibraryWindowFromDi());
    if (libWin) {

        const winBound = yield* selectTyped((state: RootState) => state.win.session.library.windowBound);
        libWin.setBounds(winBound);

        if (libWin.isMinimized()) {
            libWin.restore();
        }

        libWin.show(); // focuses as well
    }
}

function* readerCloseRequest(identifier?: string) {

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);

    for (const key in readers) {
        if (identifier && readers[key]?.identifier === identifier) {
            // Notify the streamer that a publication has been closed
            yield put(streamerActions.publicationCloseRequest.build(readers[key].publicationIdentifier));
        }
    }

    const streamerAction = yield take([
        streamerActions.publicationCloseSuccess.ID,
        streamerActions.publicationCloseError.ID,
    ]);
    const typedAction = streamerAction.error ?
        streamerAction as streamerActions.publicationCloseError.TAction :
        streamerAction as streamerActions.publicationCloseSuccess.TAction;

    if (typedAction.error) {
        // Failed to close publication
        yield put(readerActions.closeError.build(identifier));
        return;
    }

    const readerWindow = getReaderWindowFromDi(identifier);
    if (readerWindow) {
        readerWindow.close();
    }

    yield put(readerActions.closeSuccess.build(identifier));
}

function* readerSetReduxState(action: readerActions.setReduxState.TAction) {

    const { identifier, reduxState } = action.payload;
    yield put(winActions.session.setReduxState.build(identifier, reduxState));
}

function* readerCloseRequestWatcher() {
    try {

        yield all([
            yield takeEvery(readerActions.closeRequestFromPublication.ID, readerCloseRequestFromPublication),
            yield takeEvery(readerActions.closeRequest.ID, readerCLoseRequestFromIdentifier),
        ]);
    } catch (err) {
        error(filename_ + ":readerCloseRequestWatcher", err);
    }
}

// OPEN READER ENTRY POINT
function* readerOpenRequestWatcher() {
    try {

        yield all([
            yield takeEvery(readerActions.openRequest.ID, readerOpenRequest),
        ]);
    } catch (err) {
        error(filename_ + ":readerOpenRequestWatcher", err);
    }
}

function* readerDetachRequestWatcher() {
    try {

        yield all([
            yield takeLeading(readerActions.detachModeRequest.ID, readerDetachRequest),
        ]);
    } catch (err) {
        error(filename_ + ":readerDetachRequestWatcher", err);
    }
}

function* readerFullscreenRequestWatcher() {
    try {

        yield all([
            yield takeLeading(readerActions.fullScreenRequest.ID, readerFullscreenRequest),
        ]);
    } catch (err) {
        error(filename_ + ":readerFullscreenRequestWatcher", err);
    }
}

function* readerSetReduxStateWatcher() {
    try {

        yield all([
            yield takeEvery(readerActions.setReduxState.ID, readerSetReduxState),
        ]);
    } catch (err) {
        error(filename_ + ":readerSetReduxStateWatcher", err);
    }
}

export function* watchers() {
    yield all([
        call(readerOpenRequestWatcher),
        call(readerCloseRequestWatcher),
        call(readerDetachRequestWatcher),
        call(readerFullscreenRequestWatcher),
        call(readerSetReduxStateWatcher),
    ]);
}
