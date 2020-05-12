// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { screen } from "electron";
import * as ramda from "ramda";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { SenderType } from "readium-desktop/common/models/sync";
import { ToastType } from "readium-desktop/common/models/toast";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { callTyped, selectTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { diMainGet, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/error";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import {
    _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL, _VSCODE_LAUNCH,
} from "readium-desktop/preprocessor-directives";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
import { all, call, put, take } from "redux-saga/effects";
import { types } from "util";

import { streamerOpenPublicationAndReturnManifestUrl } from "./publication/openPublication";

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

    const libWin = yield* callTyped(() => getLibraryWindowFromDi());

    if (libWin) {

        // try-catch to do not trigger an error message when the winbound is not handle by the os
        let libBound: Electron.Rectangle;
        try {
            // get an bound with offset
            libBound = yield* callTyped(getWinBound, undefined);
            if (libBound) {
                libWin.setBounds(libBound);
            }
        } catch (e) {

            debug("cannot set libBound", libBound, e);
        }

        // this should never occur, but let's do it for certainty
        if (libWin.isMinimized()) {
            libWin.restore();
        }
        libWin.show(); // focuses as well
    }

    const readerWinId = action.sender?.identifier;
    if (readerWinId && action.sender?.type === SenderType.Renderer) {

        const readerWin = getReaderWindowFromDi(readerWinId);

        if (readerWin) {

            // this should never occur, but let's do it for certainty
            if (readerWin.isMinimized()) {
                readerWin.restore();
            }
            readerWin.show(); // focuses as well
        }
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

    } catch (e) {

        const translator = yield* callTyped(
            () => diMainGet("translator"));

        if (types.isNativeError(e)) {
            // disable "Error: "
            e.name = "";
        }

        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                translator.translate("message.open.error", {err: e.toString()}),
            ),
        );
    }

    if (manifestUrl) {

        const reduxState = yield* selectTyped(
            (state: RootState) =>
                state.win.registry.reader[publicationIdentifier]?.reduxState || {} as IReaderStateReader,
        );

        const sessionIsEnabled = yield* selectTyped(
            (state: RootState) => state.session.state,
        );
        if (!sessionIsEnabled) {
            const reduxDefaultConfig = yield* selectTyped(
                (state: RootState) => state.reader.defaultConfig,
            );
            reduxState.config = reduxDefaultConfig;
        }

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

    const libWin = getLibraryWindowFromDi();
    if (libWin) {

        const winBound = yield* selectTyped(
            (state: RootState) => state.win.session.library.windowBound,
        );
        libWin.setBounds(winBound);

        if (libWin.isMinimized()) {
            libWin.restore();
        }

        libWin.show(); // focuses as well
    } else {
        debug("no library windows found in readerCLoseRequestFromIdentifier function !");
    }
}

function* readerCloseRequest(identifier?: string) {

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);

    for (const key in readers) {
        if (identifier && readers[key]?.identifier === identifier) {
            // Notify the streamer that a publication has been closed
            yield put(
                streamerActions.publicationCloseRequest.build(
                    readers[key].publicationIdentifier,
                ));
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

}

function* readerSetReduxState(action: readerActions.setReduxState.TAction) {

    const { identifier, reduxState } = action.payload;
    yield put(winActions.session.setReduxState.build(identifier, reduxState));
}

export function saga() {
    return all([
        takeSpawnEvery(
            readerActions.closeRequestFromPublication.ID,
            readerCloseRequestFromPublication,
            (e) => error(filename_ + ":readerCloseRequestFromPublication", e),
        ),
        takeSpawnEvery(
            readerActions.closeRequest.ID,
            readerCLoseRequestFromIdentifier,
            (e) => error(filename_ + ":readerCLoseRequestFromIdentifier", e),
        ),
        takeSpawnEvery(
            readerActions.openRequest.ID,
            readerOpenRequest,
            (e) => error(filename_ + ":readerOpenRequest", e),
        ),
        takeSpawnLeading(
            readerActions.detachModeRequest.ID,
            readerDetachRequest,
            (e) => error(filename_ + ":readerDetachRequest", e),
        ),
        takeSpawnLeading(
            readerActions.fullScreenRequest.ID,
            readerFullscreenRequest,
            (e) => error(filename_ + ":readerFullscreenRequest", e),
        ),
        takeSpawnEvery(
            readerActions.setReduxState.ID,
            readerSetReduxState,
            (e) => error(filename_ + ":readerSetReduxState", e),
        ),
    ]);
}
