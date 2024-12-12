// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender, SenderType } from "readium-desktop/common/models/sync";
import {
    apiActions, authActions, catalogActions, dialogActions, downloadActions, historyActions, i18nActions, keyboardActions, lcpActions,
    publicationActions, themeActions,
    readerActions, sessionActions, toastActions, versionUpdateActions,
    creatorActions,
    annotationActions,
} from "readium-desktop/common/redux/actions";
import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { UnknownAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

import { RootState } from "../states";

const debug = debug_("readium-desktop:sync");

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: string[] = [
    apiActions.result.ID,

    historyActions.refresh.ID,
    historyActions.pushFeed.ID,

    dialogActions.openRequest.ID,

    readerActions.detachModeSuccess.ID,

    // readerActions.configSetDefault.ID, ALREADY AT THE BOTTOM??

    readerActions.setReduxState.ID, // used only to update the catalog when dispatched from reader

    readerActions.fullScreenRequest.ID,

    lcpActions.userKeyCheckRequest.ID,

    i18nActions.setLocale.ID,

    keyboardActions.setShortcuts.ID,
    keyboardActions.showShortcuts.ID,
    keyboardActions.reloadShortcuts.ID,

    toastActions.openRequest.ID,
    toastActions.closeRequest.ID,

    downloadActions.progress.ID,
    downloadActions.done.ID,

    // authActions.done.ID, // not used
    authActions.cancel.ID,

    // sessionActions.enable.ID,

    lcpActions.unlockPublicationWithPassphrase.ID,

    catalogActions.setCatalog.ID, // send new catalogView to library
    catalogActions.setTagView.ID,

    readerActions.disableRTLFlip.ID,

    readerActions.configSetDefault.ID, // readerConfig

    publicationActions.readingFinished.ID,
    themeActions.setTheme.ID,
    versionUpdateActions.notify.ID,

    readerActions.bookmark.pop.ID,
    readerActions.bookmark.push.ID,
    readerActions.bookmark.update.ID,

    readerActions.annotation.pop.ID,
    readerActions.annotation.push.ID,
    readerActions.annotation.update.ID,

    sessionActions.save.ID,

    creatorActions.set.ID,

    annotationActions.importTriggerModal.ID,
    // annotationActions.importConfirmOrAbort.ID,

    annotationActions.pushToAnnotationImportQueue.ID,


    // TODO: shift dispatch from one reader do not dispatch it to other reader !?! need to check this issue before merge request
    annotationActions.shiftFromAnnotationImportQueue.ID,

];

export const reduxSyncMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<UnknownAction>, RootState>) =>
        (next: (action: unknown) => unknown) => // Dispatch<ActionWithSender>
            ((action: unknown) => { // ActionWithSender

                debug("### action type", (action as ActionWithSender).type);

                if (SYNCHRONIZABLE_ACTIONS.indexOf((action as ActionWithSender).type) === -1) {
                    // Do not send
                    return next(action);
                }

                // Send this action to all the registered renderer processes

                // actually when a renderer process send an api action this middleware broadcast to all renderer
                // It should rather keep the action and don't broadcast an api request between front and back
                // this bug become a feature with a hack in publicationInfo in reader
                // thanks to this broadcast we can listen on publication tag and make a live refresh

                const browserWin: Map<string, Electron.BrowserWindow> = new Map();

                const libId = store.getState().win.session.library.identifier;
                if (libId) {
                    try {
                        const libWin = getLibraryWindowFromDi();
                        if (libWin && !libWin.isDestroyed() && !libWin.webContents.isDestroyed()) {
                            browserWin.set(libId, libWin);
                        }
                    } catch (_err) {
                        // ignore
                        // library window may be not initialized in first
                    }
                }

                const readers = store.getState().win.session.reader;
                for (const key in readers) {
                    if (readers[key]) {
                        try {
                            const readerWin = getReaderWindowFromDi(readers[key].identifier);
                            if (readerWin && !readerWin.isDestroyed() && !readerWin.webContents.isDestroyed()) {
                                browserWin.set(readers[key].identifier, readerWin);
                            }
                        } catch (_err) {
                            // ignore
                            debug("ERROR: Can't found ther reader win from di: ", readers[key].identifier);
                        }
                    }
                }

                browserWin.forEach(
                    (win, id) => {

                        if (
                            !(
                                (action as ActionWithSender).sender?.type === SenderType.Renderer
                                && (action as ActionWithSender).sender?.identifier === id
                            )
                        ) {

                            debug("send to", id);
                            const a = ActionSerializer.serialize(action as ActionWithSender);
                            // debug(a);
                            try {
                                if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
                                win.webContents.send(syncIpc.CHANNEL, {
                                    type: syncIpc.EventType.MainAction,
                                    payload: {
                                        action: a,
                                    },
                                    sender: {
                                        type: SenderType.Main,
                                    },
                                } as syncIpc.EventPayload);
                                }
                            } catch (error) {
                                debug("ERROR in SYNC ACTION", error);
                            }
                        }
                    });

                // for (const readerWindow of readerWindows) {
                //     // Notifies renderer process
                //     const winId = readerWindow.id;

                //     if (action.sender &&
                //         action.sender.type === SenderType.Renderer &&
                //         action.sender.identifier === identifier
                //     ) {
                //         // Do not send in loop an action already sent by this renderer process
                //         continue;
                //     }

                //     try {
                //         !appWindow.isDestroyed() && !appWindow.webContents.isDestroyed() && appWindow.browserWindow.webContents.send(syncIpc.CHANNEL, {
                //             type: syncIpc.EventType.MainAction,
                //             payload: {
                //                 action: actionSerializer.serialize(action),
                //             },
                //             sender: {
                //                 type: SenderType.Main,
                //             },
                //         } as syncIpc.EventPayload);
                //     } catch (error) {
                //         console.error("Windows does not exist", winId);
                //     }
                // }

                return next(action);

            });
