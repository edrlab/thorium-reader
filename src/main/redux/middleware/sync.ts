// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

import { syncIpc } from "readium-desktop/common/ipc";
import {
    apiActions,
    dialogActions,
    i18nActions,
    lcpActions,
    netActions,
    readerActions,
    toastActions,
    updateActions,
} from "readium-desktop/common/redux/actions";
import { container } from "readium-desktop/main/di";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { ActionSerializer } from "readium-desktop/common/services/serializer";

import { IActionWithSender, SenderType } from "readium-desktop/common/models/sync";

import * as debug_ from "debug";

import { AppWindow } from "readium-desktop/common/models/win";

const debug = debug_("readium-desktop:sync");

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: any = [
    apiActions.ActionType.Success,
    apiActions.ActionType.Error,

    netActions.ActionType.Offline,
    netActions.ActionType.Online,

    dialogActions.ActionType.OpenRequest,

    readerActions.ActionType.OpenError,
    readerActions.ActionType.CloseError,
    readerActions.ActionType.CloseSuccess,
    readerActions.ActionType.ModeSetError,
    readerActions.ActionType.ModeSetSuccess,
    readerActions.ActionType.ConfigSetError,
    readerActions.ActionType.ConfigSetSuccess,
    readerActions.ActionType.BookmarkSaveError,
    readerActions.ActionType.BookmarkSaveSuccess,
    readerActions.ActionType.FullscreenOnSuccess,
    readerActions.ActionType.FullscreenOffSuccess,

    lcpActions.ActionType.UserKeyCheckRequest,

    i18nActions.ActionType.Set,

    updateActions.ActionType.LatestVersionSet,

    toastActions.ActionType.OpenRequest,
];

export const reduxSyncMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>>) =>
    (next: Dispatch<IActionWithSender>) =>
    ((action: IActionWithSender) => {

    debug("### action type", action.type);

    // Test if the action must be sent to the rendeder processes
    if (SYNCHRONIZABLE_ACTIONS.indexOf(action.type) === -1) {
        // Do not send
        return next(action);
    }

    // Send this action to all the registered renderer processes
    const winRegistry = container.get("win-registry") as WinRegistry;
    const windows = winRegistry.getWindows();

    // Get action serializer
    const actionSerializer = container.get("action-serializer") as ActionSerializer;

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
            });
        } catch (error) {
            console.error("Windows does not exist", winId);
        }
    }

    return next(action);
}) as Dispatch<IActionWithSender>;
