// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { screen } from "electron";
import * as ramda from "ramda";
import { SenderType } from "readium-desktop/common/models/sync";
import { readerActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped } from "readium-desktop/common/redux/typed-saga";
import {
    getAllReaderWindowFromDi, getLibraryWindowFromDi, getReaderWindowFromDi,
} from "readium-desktop/main/di";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH,
} from "readium-desktop/preprocessor-directives";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { all, call, put, take, takeEvery, takeLeading } from "redux-saga/effects";
import { streamerOpenPublicationAndReturnManifestUrl } from "./streamer";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");
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

function* readerDetachRequest(_action: readerActions.detachModeRequest.TAction) {

    const readerWin = yield* callTyped(() => getAllReaderWindowFromDi()[0]);
    const libWin = yield* callTyped(() => getLibraryWindowFromDi());

    if (libWin) {

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

    let winBound = yield* selectTyped(
        (state: RootState) => state.win.registry.reader[publicationIdentifier]?.windowBound,
    );

    if (!winBound) {
        const winBoundArray = [];

        if (ObjectKeys(readers).length) {

            const displayArea = yield* callTyped(() => screen.getPrimaryDisplay().workAreaSize);

            for (const key in readers) {
                if (readers[key]) {
                    const rectangle = readers[key].windowBound;

                    rectangle.x += 100;
                    rectangle.x %= displayArea.width - rectangle.width;
                    rectangle.y += 100;
                    rectangle.y %= displayArea.height - rectangle.height;

                    winBoundArray.push(rectangle);
                }
            }
            winBound = ramda.uniq(winBoundArray)[0];

        } else {
            winBound = library.windowBound;
        }
    }

    return winBound;
}

function* readerOpenRequest(action: readerActions.openRequest.TAction) {

    debug(`readerOpenRequest:action:${JSON.stringify(action)}`);

    const publicationIdentifier = action.payload.publicationIdentifier;
    const manifestUrl = yield* callTyped(streamerOpenPublicationAndReturnManifestUrl, publicationIdentifier);

    if (manifestUrl) {

        const reduxState = yield* selectTyped(
            (state: RootState) => state.win.registry.reader[publicationIdentifier]?.reduxState,
        );

        const winBound = yield* callTyped(getWinBound, publicationIdentifier);

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
        if (readers[key] && readers[key].publicationIdentifier === action.payload.publicationIdentifier) {
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
    yield takeEvery(readerActions.closeRequestFromPublication.ID, readerCloseRequestFromPublication);
    yield takeEvery(readerActions.closeRequest.ID, readerCLoseRequestFromIdentifier);
}

// OPEN READER ENTRY POINT
function* readerOpenRequestWatcher() {
    yield takeEvery(readerActions.openRequest.ID, readerOpenRequest);
}

function* readerDetachRequestWatcher() {
    yield takeLeading(readerActions.detachModeRequest.ID, readerDetachRequest);
}

function* readerFullscreenRequestWatcher() {
    yield takeLeading(readerActions.fullScreenRequest.ID, readerFullscreenRequest);
}

function* readerSetReduxStateWatcher() {
    yield takeEvery(readerActions.setReduxState.ID, readerSetReduxState);
}

export function* watcher() {
    yield all([
        call(readerOpenRequestWatcher),
        call(readerCloseRequestWatcher),
        call(readerDetachRequestWatcher),
        call(readerFullscreenRequestWatcher),
        call(readerSetReduxStateWatcher),
    ]);
}
