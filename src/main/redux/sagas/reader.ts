// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { clipboard, screen } from "electron";
import * as ramda from "ramda";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";
import { SenderType } from "readium-desktop/common/models/sync";
import { ToastType } from "readium-desktop/common/models/toast";
import { normalizeRectangle } from "readium-desktop/common/rectangle/window";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { diMainGet, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { streamerActions, winActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put, take } from "redux-saga/effects";
import { call as callTyped, select as selectTyped, put as putTyped } from "typed-redux-saga/macro";
import { types } from "util";

import {
    ERROR_MESSAGE_ON_USERKEYCHECKREQUEST, streamerOpenPublicationAndReturnManifestUrl,
} from "./publication/openPublication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";

// Logger
const filename_ = "readium-desktop:main:saga:reader";
const debug = debug_(filename_);
debug("_");

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
    if (libWin && !libWin.isDestroyed()) {

        // try-catch to do not trigger an error message when the winbound is not handle by the os
        let libBound: Electron.Rectangle;
        try {
            // get an bound with offset
            libBound = yield* callTyped(getWinBound, undefined);
            debug("getWinBound(undefined)", libBound);
            if (libBound) {
                libWin.setBounds(libBound);
            }
        } catch (e) {
            debug("error libWin.setBounds(libBound)", e);
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

function* getWinBound(publicationIdentifier: string | undefined) {

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
    const library = yield* selectTyped((state: RootState) => state.win.session.library);
    const readerArray = ObjectValues(readers);

    debug("library.windowBound", library.windowBound);
    normalizeRectangle(library.windowBound);

    if (readerArray.length === 0) {
        return library.windowBound;
    }

    let winBound = (yield* selectTyped(
        (state: RootState) => state.win.registry.reader[publicationIdentifier]?.windowBound,
    )) as Electron.Rectangle | undefined;

    winBound = normalizeRectangle(winBound);
    debug(`reader[${publicationIdentifier}]?.winBound}`, winBound);

    const winBoundArray = readerArray.map((reader) => reader.windowBound);
    winBoundArray.push(library.windowBound);
    const winBoundAlreadyTaken = !winBound || !!winBoundArray.find((bound) => ramda.equals(winBound, bound));

    if (
        !winBound
        || winBoundAlreadyTaken
    ) {
        if (readerArray.length) {

            const displayArea = yield* callTyped(() => screen.getPrimaryDisplay().workAreaSize);
            debug("displayArea", displayArea);

            const winBoundWithOffset = winBoundArray.map(
                (rect) => {
                    if (!rect.x) { // NaN, undefined, null, zero (positive and negative numbers are truthy)
                        rect.x = 0;
                    }
                    rect.x += 100;
                    const wDiff = Math.abs(displayArea.width - rect.width);
                    if (wDiff) {
                        rect.x %= wDiff;
                    }

                    if (!rect.y) { // NaN, undefined, null, zero (positive and negative numbers are truthy)
                        rect.y = 0;
                    }
                    rect.y += 100;
                    const hDiff = Math.abs(displayArea.height - rect.height);
                    if (hDiff) {
                        rect.y %= hDiff;
                    }

                    debug("rect", rect);
                    return rect;
                },
            );
            debug("winBoundWithOffset", winBoundWithOffset);

            [winBound] = ramda.uniq(winBoundWithOffset);
            debug("winBound", winBound);
            winBound = normalizeRectangle(winBound);

        } else {
            winBound = normalizeRectangle(library.windowBound);
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

        if (e.toString() !== ERROR_MESSAGE_ON_USERKEYCHECKREQUEST) {

            const translator = yield* callTyped(
                () => diMainGet("translator"));

            if (types.isNativeError(e)) {
                // disable "Error: "
                e.name = "";
            }

            yield put(
                toastActions.openRequest.build(
                    ToastType.Error,
                    translator.translate("message.open.error", { err: e.toString() }),
                ),
            );
        }

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

    const libWin = yield* callTyped(() => getLibraryWindowFromDi());
    if (libWin && !libWin.isDestroyed()) {

        const winBound = yield* selectTyped(
            (state: RootState) => state.win.session.library.windowBound,
        );
        debug("state.win.session.library.windowBound", winBound);
        try {
            libWin.setBounds(winBound);
        } catch (e) {
            debug("error libWin.setBounds(winBound)", e);
        }

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

    const streamerAction: Action<any> = yield take([
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

    const { winId, reduxState } = action.payload;

    const pubId = yield* selectTyped(
        (state: RootState) => state?.win?.session?.reader[winId]?.reduxState?.info?.publicationIdentifier);
    yield put(winActions.session.setReduxState.build(winId, pubId, reduxState));
}

function* readerClipboardCopy(action: readerActions.clipboardCopy.TAction) {

    const { publicationIdentifier, clipboardData } = action.payload;
    const clipBoardType = "clipboard";

    let textToCopy = clipboardData.txt;

    const publicationRepository = diMainGet("publication-repository");
    const translator = diMainGet("translator");
    const publicationDocument = yield* callTyped(() => publicationRepository.get(
        publicationIdentifier,
    ));

    if (!publicationDocument.lcp ||
        !publicationDocument.lcp.rights ||
        publicationDocument.lcp.rights.copy === null ||
        typeof publicationDocument.lcp.rights.copy === "undefined" ||
        publicationDocument.lcp.rights.copy < 0) {

        clipboard.writeText(textToCopy, clipBoardType);
        return ;
    }

    const lcpRightsCopies = publicationDocument.lcpRightsCopies ?
        publicationDocument.lcpRightsCopies : 0;
    const lcpRightsCopiesRemain = publicationDocument.lcp.rights.copy - lcpRightsCopies;
    if (lcpRightsCopiesRemain <= 0) {
        yield* putTyped(toastActions.openRequest.build(ToastType.Error,
            `LCP [${translator.translate("app.edit.copy")}] ${publicationDocument.lcpRightsCopies} / ${publicationDocument.lcp.rights.copy}`,
            publicationIdentifier));
    }
    const nCharsToCopy = textToCopy.length > lcpRightsCopiesRemain ?
        lcpRightsCopiesRemain : textToCopy.length;
    if (nCharsToCopy < textToCopy.length) {
        textToCopy = textToCopy.substr(0, nCharsToCopy);
    }
    const newPublicationDocument: PublicationDocument = Object.assign(
        {},
        publicationDocument,
        {
            lcpRightsCopies: lcpRightsCopies + nCharsToCopy,
        },
    );
    yield* callTyped(() => publicationRepository.save(newPublicationDocument));

    clipboard.writeText(`${textToCopy}`, clipBoardType);

    yield* putTyped(toastActions.openRequest.build(ToastType.Success,
        `LCP [${translator.translate("app.edit.copy")}] ${newPublicationDocument.lcpRightsCopies} / ${publicationDocument.lcp.rights.copy}`,
        publicationIdentifier));
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
        takeSpawnEvery(
            readerActions.clipboardCopy.ID,
            readerClipboardCopy,
            (e) => error(filename_ + ":readerClipboardCopy", e),
        ),
    ]);
}
