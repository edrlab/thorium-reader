// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { clipboard, screen } from "electron";
import * as ramda from "ramda";
import { ReaderMode } from "readium-desktop/common/models/reader";
import { Action } from "readium-desktop/common/models/redux";
import { ActionWithDestination, ActionWithSender, SenderType } from "readium-desktop/common/models/sync";
import { ToastType } from "readium-desktop/common/models/toast";
import { defaultRectangle, normalizeRectangle } from "readium-desktop/common/rectangle/window";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { diMainGet, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { streamerActions } from "readium-desktop/main/redux/actions";
import { RootState } from "readium-desktop/main/redux/states";
import { ObjectValues } from "readium-desktop/utils/object-keys-values";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put, take } from "redux-saga/effects";
import { call as callTyped, select as selectTyped, put as putTyped, SagaGenerator } from "typed-redux-saga/macro";
import { types } from "util";
import { v4 as uuidv4 } from "uuid";

import {
    ERROR_MESSAGE_ON_USERKEYCHECKREQUEST, ERROR_MESSAGE_ENCRYPTED_NO_LICENSE, streamerOpenPublicationAndReturnManifestUrl,
} from "./publication/openPublication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { getTranslator } from "readium-desktop/common/services/translator";
import { createReaderWindow } from "./win/browserWindow/createReaderWindow";

// Logger
const filename_ = "readium-desktop:main:saga:reader";
const debug = debug_(filename_);
debug("_");

const isUUIDv4 = (uuid: string) => /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(uuid);
const assertUUIDv4 = (uuid: string) => {
    if (!isUUIDv4(uuid)) {
        throw new Error("not an uuidv4 identifier !");
    }
};

function* readerFullscreenRequest(action: readerActions.fullScreenRequest.TAction) {

    const sender = action.sender;

    if (sender?.identifier && sender?.type === SenderType.Renderer) {

        const readerWin = yield* callTyped(() => getReaderWindowFromDi(sender.identifier));

        if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {
            readerWin.setFullScreen(action.payload.full);
        }
    }
}

function* readerDetachRequest(action: readerActions.detachModeRequest.TAction) {

    const libWin = yield* callTyped(() => getLibraryWindowFromDi());
    if (libWin && !libWin.isDestroyed() && !libWin.webContents.isDestroyed()) {

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
        if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {

            // this should never occur, but let's do it for certainty
            if (readerWin.isMinimized()) {
                readerWin.restore();
            }
            readerWin.show(); // focuses as well
        }
    }

    yield put(readerActions.detachModeSuccess.build());
}

export function* getWinBound(publicationIdentifier: string | undefined): SagaGenerator<Electron.Rectangle> {

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
    const library = yield* selectTyped((state: RootState) => state.win.session.library);
    const readerArray = ObjectValues(readers);

    debug("library.windowBound", library.windowBound);
    // normalizeRectangle(library.windowBound);

    // if (readerArray.length === 0) {
    //     return library.windowBound;
    // }

    // let winBound = (yield* selectTyped(
    //     (state: RootState) => state.win.registry.reader[publicationIdentifier]?.windowBound,
    // )) as Electron.Rectangle | undefined;
    let winBound: Electron.Rectangle | undefined = yield* callTyped(() => diMainGet("publication-data").readJsonObj(publicationIdentifier, "bound")) as any; // TODO: type object
    try {
        winBound = normalizeRectangle(winBound);
    } catch {
        winBound = defaultRectangle();
    }
    debug(`reader[${publicationIdentifier}]?.winBound}`, winBound);

    const winBoundArray = readerArray.map((reader) => reader.windowBound);
    winBoundArray.push(library.windowBound);
    const winBoundAlreadyTaken = !winBound || !!winBoundArray.find((bound) => ramda.equals(winBound, bound));

    if (
        !winBound
        || winBoundAlreadyTaken
    ) {
        // if (readerArray.length) {

            const displayArea = yield* callTyped(() => screen.getPrimaryDisplay().workAreaSize);
            debug("displayArea", displayArea);

            const winBoundWithOffset = winBoundArray.map(
                (rect) => {
                    if (!rect.x) { // NaN, undefined, null, zero (positive and negative numbers are truthy)
                        rect.x = 0;
                    }
                    rect.x += 20;
                    const wDiff = Math.abs(displayArea.width - rect.width);
                    if (wDiff) {
                        rect.x %= wDiff;
                    }

                    if (!rect.y) { // NaN, undefined, null, zero (positive and negative numbers are truthy)
                        rect.y = 0;
                    }
                    rect.y += 20;
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

        // } else {
        //     winBound = normalizeRectangle(library.windowBound);
        // }
    }

    return winBound;
}

function* readerOpenRequest(action: readerActions.openRequest.TAction) {

    const publicationIdentifier = action.payload.publicationIdentifier;
    debug(`START REQUEST to open a reader with pubId=${publicationIdentifier}, action=${JSON.stringify(action)}`);

    assertUUIDv4(publicationIdentifier);

    let manifestUrl: string;
    try {
        manifestUrl = yield* callTyped(streamerOpenPublicationAndReturnManifestUrl, publicationIdentifier);

    } catch (e) {

        const errMsg = e.toString();
        if (errMsg === ERROR_MESSAGE_ENCRYPTED_NO_LICENSE) {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Error,
                    getTranslator().translate("message.open.error", { err: getTranslator().translate("publication.encryptedNoLicense") }),
                ),
            );
        } else if (errMsg !== ERROR_MESSAGE_ON_USERKEYCHECKREQUEST) {

            if (types.isNativeError(e)) {
                // disable "Error: "
                e.name = "";
            }

            yield put(
                toastActions.openRequest.build(
                    ToastType.Error,
                    getTranslator().translate("message.open.error", { err: errMsg }),
                ),
            );
        }

    }

    if (manifestUrl) {

        // const reduxState: Partial<IReaderStateReaderPersistence> = yield* selectTyped(
        //     (state: RootState) =>
        //         state.win.registry.reader[publicationIdentifier]?.reduxState || {},
        // );

        // session always enabled
        // const sessionIsEnabled = yield* selectTyped(
        //     (state: RootState) => state.session.state,
        // );
        // if (!sessionIsEnabled) {
        //     const reduxDefaultConfig = yield* selectTyped(
        //         (state: RootState) => state.reader.defaultConfig,
        //     );
        //     reduxState.config = reduxDefaultConfig;
        // }

        // const winBound = yield* callTyped(getWinBound, publicationIdentifier);

        // const readers = yield* selectTyped(
        //     (state: RootState) => state.win.session.reader,
        // );
        // const readersArray = ObjectValues(readers);

        const mode = yield* selectTyped((state: RootState) => state.mode);
        if (mode === ReaderMode.Attached) {
            try {
                const libWin = getLibraryWindowFromDi();
                if (libWin && !libWin.isDestroyed() && !libWin.webContents.isDestroyed()) {
                    libWin.hide();
                }
            } catch (_err) {
                debug("library can't be loaded from di");
            }
        }

        const windowIdentifier = uuidv4();
        yield* callTyped(createReaderWindow,
            publicationIdentifier,
            manifestUrl,
            windowIdentifier,
            // winBound,
            // reduxState,
        );

    }
}

// use to close readers with the same publication identifier from main process
export function* RequesetToCloseAllReadersWithTheSamePubId(publicationIdentifier: string): SagaGenerator<boolean> {

    assertUUIDv4(publicationIdentifier);

    const readers = yield* selectTyped((state: RootState) => state.win.session.reader);

    let atLeastOneReaderIsOpen = false;
    for (const windowIdentifier in readers) {
        if (readers[windowIdentifier]?.publicationIdentifier === publicationIdentifier) {
            atLeastOneReaderIsOpen = true;
            yield* putTyped(readerActions.closeRequest.build(windowIdentifier, publicationIdentifier));
        }
    }

    return atLeastOneReaderIsOpen;
}

function* readerCLoseRequestFromIdentifier(action: readerActions.closeRequest.TAction) {

    const pubId = action.sender?.reader_pubId || action.payload.publicationIdentifier;
    const winId = action.sender?.identifier || action.payload.windowIdentifier;
    debug(`START REQUEST to close reader winId=${winId} with pubId=${pubId}`);

    assertUUIDv4(winId);
    assertUUIDv4(pubId);
    
    yield call(readerCloseRequest, winId, pubId);

    const libWin = yield* callTyped(() => getLibraryWindowFromDi());
    if (libWin && !libWin.isDestroyed() && !libWin.webContents.isDestroyed()) {

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

function* readerCloseRequest(windowIdentifier: string, publicationIdentifier: string) {

    // const readers = yield* selectTyped((state: RootState) => state.win.session.reader);

    // for (const key in readers) {
    //     if (windowIdentifier && readers[key]?.identifier === windowIdentifier) {
    //         // Notify the streamer that a publication has been closed
    //         yield put(
    //             streamerActions.publicationCloseRequest.build(
    //                 readers[key].publicationIdentifier,
    //             ));
    //     }
    // }
    // Notify the streamer that a publication has been closed
    yield put(
        streamerActions.publicationCloseRequest.build(
            publicationIdentifier,
        ));

    const streamerAction: Action<any> = yield take([
        streamerActions.publicationCloseSuccess.ID,
        streamerActions.publicationCloseError.ID,
    ]);
    const typedAction = streamerAction.error ?
        streamerAction as streamerActions.publicationCloseError.TAction :
        streamerAction as streamerActions.publicationCloseSuccess.TAction;

    if (typedAction.error) {
        // Failed to close publication
        yield put(readerActions.closeError.build(windowIdentifier));
        return;
    }

    const readerWindow = getReaderWindowFromDi(windowIdentifier);
    if (readerWindow && !readerWindow.isDestroyed() && !readerWindow.webContents.isDestroyed()) {
        readerWindow.close();
    }

}

// TODO: remove it
//  reader session is initialized for reader.info properties and then never updated 
// function* readerSetReduxState(action: readerActions.setReduxState.TAction) {

//     const { winId, reduxState } = action.payload;

//     // const pubId = yield* selectTyped(
//         // (state: RootState) => state?.win?.session?.reader[winId]?.reduxState?.info?.publicationIdentifier);
//     // yield put(winActions.session.setReduxState.build(winId, pubId, reduxState));

//     const readers = yield* selectTyped((state: RootState) => state.win.session.reader);
//     const reader = readers[winId];

//     if (reader) {

//         yield put(winActions.session.setReduxState.build(winId, reader.publicationIdentifier, reduxState));

//         yield put(winActions.registry.registerReaderPublication.build(
//             reader.publicationIdentifier,
//             reader.windowBound,
//             reduxState));
//     } else {
//         debug("!!! Error no reader window found, why ??", winId);
//     }
// }

function* readerPrint(action: readerActions.print.TAction) {

    const { publicationIdentifier, pageRange } = action.payload;

    if ((action as ActionWithDestination).destination) {
        return ; // action to renderer destination
    }

    debug("READER PRINT FROM MAIN PROCESS", action.payload);

    const publicationRepository = diMainGet("publication-repository");
    const translator = getTranslator();
    const publicationDocument = yield* callTyped(() => publicationRepository.get(
        publicationIdentifier,
    ));

    if (!publicationDocument.lcp ||
        !publicationDocument.lcp.rights ||
        publicationDocument.lcp.rights.print === null ||
        typeof publicationDocument.lcp.rights.print === "undefined" ||
        publicationDocument.lcp.rights.print < 0) {

        const actionToSend = readerActions.print.build(publicationIdentifier, pageRange, (action as unknown as ActionWithSender)?.sender?.identifier);
        yield* putTyped(actionToSend);
        return ;
    }

    const lcpRightsPrints = publicationDocument.lcpRightsPrints || [];
    const lcpRightsPrintsRemain = publicationDocument.lcp.rights.print - lcpRightsPrints.length;
    const pagesToPrintSaved = pageRange.filter((page) => lcpRightsPrints.some((pageSaved) => pageSaved === page));
    const pagesToPrintNotSaved = pageRange.filter((page) => !pagesToPrintSaved.some((pageSaved) => pageSaved === page));
    const pagesToPrintNotSavedRightTruncated = pagesToPrintNotSaved.slice(0, lcpRightsPrintsRemain);
    const pagesToPrint: number[] = [...pagesToPrintSaved, ...pagesToPrintNotSavedRightTruncated].sort((a, b) => a-b);
    const newLcpRightsPrints = [...lcpRightsPrints, ...pagesToPrintNotSavedRightTruncated].sort((a, b) => a-b);

    const newPublicationDocument: PublicationDocument = Object.assign(
        {},
        publicationDocument,
        {
            lcpRightsPrints: newLcpRightsPrints,
        },
    );

    yield* callTyped(() => publicationRepository.save(newPublicationDocument));

    if (pagesToPrint.length) {
        const actionToSend = readerActions.print.build(publicationIdentifier, pagesToPrint, (action as unknown as ActionWithSender)?.sender?.identifier);
        yield* putTyped(actionToSend);

        yield* putTyped(toastActions.openRequest.build(ToastType.Success,
            `LCP [${translator.translate("app.edit.print")}] [${pagesToPrint}] / ${publicationDocument.lcp.rights.print}`,
            publicationIdentifier));
    } else {
        yield* putTyped(toastActions.openRequest.build(ToastType.Error,
            `LCP [${translator.translate("app.edit.print")}] ${publicationDocument.lcpRightsPrints.length} / ${publicationDocument.lcp.rights.print}`,
            publicationIdentifier));
    }
}

function* readerClipboardCopy(action: readerActions.clipboardCopy.TAction) {

    const { publicationIdentifier, clipboardData } = action.payload;
    const clipBoardType = "clipboard";

    let textToCopy = clipboardData.txt;

    const publicationRepository = diMainGet("publication-repository");
    const translator = getTranslator();
    const publicationDocument = yield* callTyped(() => publicationRepository.get(
        publicationIdentifier,
    ));

    debug("LCP RIGHTS", JSON.stringify(publicationDocument.lcp?.rights, null, 4));

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
        // TODO: remove it
        // takeSpawnEvery(
        //     readerActions.setReduxState.ID,
        //     readerSetReduxState,
        //     (e) => error(filename_ + ":readerSetReduxState", e),
        // ),
        takeSpawnEvery(
            readerActions.clipboardCopy.ID,
            readerClipboardCopy,
            (e) => error(filename_ + ":readerClipboardCopy", e),
        ),
        takeSpawnEvery(
            readerActions.print.ID,
            readerPrint,
            (e) => error(filename_ + ":readerPrint", e),
        ),
    ]);
}
