// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { BrowserWindow, Menu } from "electron";
import * as path from "path";
import { LocatorType } from "readium-desktop/common/models/locator";
import { Reader, ReaderConfig, ReaderMode } from "readium-desktop/common/models/reader";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { AppWindowType } from "readium-desktop/common/models/win";
import { getWindowBounds } from "readium-desktop/common/rectangle/window";
import { readerActions, i18nActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import { setMenu } from "readium-desktop/main/menu";
import { appActions, streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH, IS_DEV,
} from "readium-desktop/preprocessor-directives";
import { SagaIterator } from "redux-saga";
import { all, call, put, take, takeEvery } from "redux-saga/effects";

// Logger
const debug = debug_("readium-desktop:main:redux:sagas:reader");








const READER_CONFIG_ID = "reader";

export function* readerConfigSetRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for save request
        const action = yield* takeTyped(readerActions.configSetRequest.build);

        const configValue = action.payload.config;
        const config: Omit<ConfigDocument<ReaderConfig>, keyof Timestampable> = {
            identifier: READER_CONFIG_ID,
            value: configValue,
        };

        // Get reader settings
        const configRepository: ConfigRepository<ReaderConfig> = diMainGet("config-repository");

        try {
            yield call(() => configRepository.save(config));
            yield put(readerActions.configSetSuccess.build(configValue));
        } catch (error) {
            yield put(readerActions.configSetError.build(error));
        }
    }
}

export function* readerConfigInitWatcher(): SagaIterator {
    // Wait for app initialization
    yield take(appActions.initSuccess.ID);

    const configRepository: ConfigRepository<ReaderConfig> = diMainGet("config-repository");

    try {
        const readerConfigDoc = yield* callTyped(() => configRepository.get(READER_CONFIG_ID));

        // Returns the first reader configuration available in database
        yield put(readerActions.configSetSuccess.build(readerConfigDoc.value));
    } catch (error) {
        yield put(readerActions.configSetError.build(error));
    }
}

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

export function* readerFullscreenRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for app initialization
        const action = yield* takeTyped(readerActions.fullScreenRequest.build);

        // Get browser window
        const sender = action.sender;

        const winRegistry = diMainGet("win-registry");
        const appWindow = winRegistry.getWindowByIdentifier(sender.winId);
        if (appWindow) {
            appWindow.browserWindow.setFullScreen(action.payload.full);
        }
    }
}

export function* readerDetachRequestWatcher(): SagaIterator {
    while (true) {
        // Wait for a change mode request
        const action = yield* takeTyped(readerActions.detachModeRequest.build);

        const readerMode = action.payload.mode;
        const reader = action.payload.reader;

        if (readerMode === ReaderMode.Detached) {
            const winRegistry = diMainGet("win-registry");

            const libraryAppWindow = winRegistry.getLibraryWindow();
            if (libraryAppWindow) {
                // this should never occur, but let's do it for certainty
                if (libraryAppWindow.browserWindow.isMinimized()) {
                    libraryAppWindow.browserWindow.restore();
                }
                libraryAppWindow.browserWindow.show(); // focuses as well
            }

            const readerWindow = winRegistry.getWindowByIdentifier(reader.identifier);
            if (readerWindow) {
                readerWindow.onWindowMoveResize.detach();

                // this should never occur, but let's do it for certainty
                if (readerWindow.browserWindow.isMinimized()) {
                    readerWindow.browserWindow.restore();
                }
                readerWindow.browserWindow.show(); // focuses as well
            }
        }

        yield put(readerActions.detachModeSuccess.build(readerMode));
    }
}

function* readerOpenRequest(action: readerActions.openRequest.TAction) {

    const publicationIdentifier = action.payload.publicationIdentifier;

    // Notify the streamer to create a manifest for this publication
    yield put(streamerActions.publicationOpenRequest.build(publicationIdentifier));

    // Wait for the publication to be opened
    const streamerAction = yield take([
        streamerActions.publicationOpenSuccess.ID,
        streamerActions.publicationOpenError.ID,
    ]);
    const typedAction = streamerAction.error ?
        streamerAction as streamerActions.publicationOpenError.TAction :
        streamerAction as streamerActions.publicationOpenSuccess.TAction;

    if (typedAction.error) {
        // Failed to open publication
        // FIXME: Put publication in meta to be FSA compliant
        yield put(readerActions.openError.build(publicationIdentifier));
        return;
    }

    const { manifestUrl } = typedAction.payload as streamerActions.publicationOpenSuccess.Payload;
    const winBound = yield* selectTyped(
        (state: RootState) => state.win.registry.reader[publicationIdentifier]?.windowBound,
    );
    const reduxState = yield* selectTyped(
        (state: RootState) => state.win.registry.reader[publicationIdentifier]?.reduxState,
    );

    yield put(winActions.reader.openRequest.build(
        publicationIdentifier,
        manifestUrl,
        winBound,
        reduxState,
    ));
}

function* readerOpenRequestWatcher() {
    yield takeEvery(readerActions.openRequest.ID, readerOpenRequest);
}

function* readerCloseRequest(action: readerActions.closeRequestFromPublication.TAction |
    readerActions.closeRequest.TAction) {

    let identifier;
    if (action.payload.identifier) {
        identifier = action.payload.identifier;
    }

    // Notify the streamer that a publication has been closed
    yield put(streamerActions.publicationCloseRequest.build(publicationIdentifier));

    // Wait for the publication to be closed
    const streamerAction = yield take([
        streamerActions.publicationCloseSuccess.ID,
        streamerActions.publicationCloseError.ID,
    ]);
    const typedAction = streamerAction.error ?
        streamerAction as streamerActions.publicationCloseError.TAction :
        streamerAction as streamerActions.publicationCloseSuccess.TAction;

    if (typedAction.error) {
        // Failed to close publication
        yield put(readerActions.closeError.build(publicationIdentifier));
        return;
    }

    const winRegistry = diMainGet("win-registry");

    if (identifier) {
        const libraryAppWindow = winRegistry.getLibraryWindow();
        if (libraryAppWindow) {
            yield call(async () => {
                libraryAppWindow.browserWindow.setBounds(await getWindowBounds(AppWindowType.Library));
            });
            if (libraryAppWindow.browserWindow.isMinimized()) {
                libraryAppWindow.browserWindow.restore();
            }
            libraryAppWindow.browserWindow.show(); // focuses as well
        }
    }

    const readerWindow = winRegistry.getWindowByIdentifier(reader.identifier);
    if (readerWindow) {
        readerWindow.browserWindow.close();
    }

    yield put(readerActions.closeSuccess.build(reader));
}

/*
export function* closeReaderFromPublicationWatcher(): SagaIterator {
    while (true) {
        // tslint:disable-next-line: max-line-length
        const action = yield* takeTyped(readerActions.closeRequestFromPublication.build);

        const publicationIdentifier = action.payload.publicationIdentifier;

        const readers = yield* selectTyped((s: RootState) => s.reader.readers);

        for (const reader of Object.values(readers)) {
            if (reader.publicationIdentifier === publicationIdentifier) {
                yield call(() => closeReader(reader, false));
            }
        }
    }
}
*/

function* readerCloseRequestWatcher() {
    yield takeEvery(readerActions.closeRequestFromPublication.ID, readerCloseRequest);
    yield takeEvery(readerActions.closeRequest.ID, readerCloseRequest);
}

export function* watcher() {
    yield all([
        call(readerOpenRequestWatcher),
        call(readerCloseRequestWatcher),
    ]);
}
