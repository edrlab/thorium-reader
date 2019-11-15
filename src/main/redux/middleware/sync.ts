// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender, SenderType } from "readium-desktop/common/models/sync";
import { AppWindow } from "readium-desktop/common/models/win";
import {
    apiActions, dialogActions, downloadActions, i18nActions, lcpActions, netActions, readerActions,
    toastActions, updateActions,
} from "readium-desktop/common/redux/actions";
import { diMainGet } from "readium-desktop/main/di";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

const debug = debug_("readium-desktop:sync");

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: string[] = [
    apiActions.result.ID,

    netActions.offline.ID,
    netActions.online.ID,

    dialogActions.openRequest.ID,

    readerActions.openError.ID,
    readerActions.closeError.ID,
    readerActions.closeSuccess.ID,

    readerActions.detachModeSuccess.ID,

    readerActions.configSetError.ID,
    readerActions.configSetSuccess.ID,

    readerActions.saveBookmarkError.ID,
    readerActions.saveBookmarkSuccess.ID,

    readerActions.fullScreenRequest.ID,

    lcpActions.userKeyCheckRequest.ID,

    i18nActions.setLocale.ID,

    updateActions.latestVersion.ID,

    toastActions.openRequest.ID,
    toastActions.closeRequest.ID,

    downloadActions.request.ID,
    downloadActions.progress.ID,
    downloadActions.success.ID,
    downloadActions.error.ID,
];

export const reduxSyncMiddleware: Middleware
    = (_store: MiddlewareAPI<Dispatch<AnyAction>>) =>
    (next: Dispatch<ActionWithSender>) =>
    ((action: ActionWithSender) => {

    debug("### action type", action.type);

    // Test if the action must be sent to the rendeder processes
    if (SYNCHRONIZABLE_ACTIONS.indexOf(action.type) === -1) {
        // Do not send
        return next(action);
    }

    // Send this action to all the registered renderer processes
    const winRegistry = diMainGet("win-registry");
    const windows = winRegistry.getWindows();

    // Get action serializer
    const actionSerializer = diMainGet("action-serializer");

    for (const appWin of Object.values(windows)) {
        const appWindow = appWin as AppWindow;

        // Notifies renderer process
        const win = appWindow.win;
        const winId = appWindow.identifier;

        if (action.sender &&
            action.sender.type === SenderType.Renderer &&
            action.sender.winId === winId
        ) {
            // Do not send in loop an action already sent by this renderer process
            continue;
        }

        try {
            win.webContents.send(syncIpc.CHANNEL, {
                type: syncIpc.EventType.MainAction,
                payload: {
                    action: actionSerializer.serialize(action),
                },
                sender: {
                    type: SenderType.Main,
                },
            } as syncIpc.EventPayload);
        } catch (error) {
            console.error("Windows does not exist", winId);
        }
    }

    return next(action);
}) as Dispatch<ActionWithSender>;
