// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug_ from "debug";
import { Reader, ReaderConfig, ReaderMode } from "readium-desktop/common/models/reader";
import { Timestampable } from "readium-desktop/common/models/timestampable";
import { AppWindowType } from "readium-desktop/common/models/win";
import { getWindowBounds } from "readium-desktop/common/rectangle/window";
import { readerActions } from "readium-desktop/common/redux/actions";
import { callTyped, selectTyped, takeTyped } from "readium-desktop/common/redux/typed-saga";
import { createWindowReader } from "readium-desktop/main/createWindowReader";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet } from "readium-desktop/main/di";
import { appActions, streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH,
} from "readium-desktop/preprocessor-directives";
import { SagaIterator } from "redux-saga";
import { all, call, put, take } from "redux-saga/effects";

// Logger
// const debug = debug_("readium-desktop:main:redux:sagas:reader");

export function* readerOpenRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield* takeTyped(readerActions.openRequest.build);
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
            continue;
        }

        const manifestUrl = typedAction.payload.manifestUrl;
        const reader = yield* callTyped(
            () => createWindowReader(publicationIdentifier, manifestUrl),
        );

        // Publication is opened in a new reader
        yield put(readerActions.openSuccess.build(reader));
    }
}

export function* readerCloseRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield* takeTyped(readerActions.closeRequest.build);

        const reader = action.payload.reader;
        const gotoLibrary = action.payload.gotoLibrary;

        yield call(() => closeReader(reader, gotoLibrary));
    }
}

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

function* closeReader(reader: Reader, gotoLibrary: boolean) {
    const publicationIdentifier = reader.publicationIdentifier;

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
        yield put(readerActions.closeError.build(reader));
        return;
    }

    const winRegistry = diMainGet("win-registry");

    if (gotoLibrary) {
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

export function* watchers() {
    yield all([
        // call(readerBookmarkSaveRequestWatcher),
        call(readerCloseRequestWatcher),
        call(readerConfigInitWatcher),
        call(readerConfigSetRequestWatcher),
        call(readerOpenRequestWatcher),
        call(readerFullscreenRequestWatcher),
        call(readerDetachRequestWatcher),
        call(closeReaderFromPublicationWatcher),
    ]);
}
