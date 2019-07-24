// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ipcRenderer } from "electron";
import { Action, AnyAction, Dispatch, Middleware, MiddlewareAPI, Store } from "redux";

import { syncIpc } from "readium-desktop/common/ipc";
import {
    apiActions,
    i18nActions,
    readerActions,
} from "readium-desktop/common/redux/actions";

import { IActionWithSender, SenderType } from "readium-desktop/common/models/sync";

import { container } from "readium-desktop/renderer/di";

import { ActionSerializer } from "readium-desktop/common/services/serializer";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: any = [

    apiActions.ActionType.Request,

    readerActions.ActionType.OpenRequest,
    readerActions.ActionType.CloseRequest,
    readerActions.ActionType.ModeSetRequest,
    readerActions.ActionType.ConfigSetRequest,
    readerActions.ActionType.BookmarkSaveRequest,
    readerActions.ActionType.FullscreenOffRequest,
    readerActions.ActionType.FullscreenOnRequest,

    i18nActions.ActionType.Set,
];

export const reduxSyncMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>>) =>
    (next: Dispatch<IActionWithSender>) =>
    ((action: IActionWithSender) => {

    // Does this action must be sent to the main process
    if (SYNCHRONIZABLE_ACTIONS.indexOf(action.type) === -1) {
        // Do not send
        return next(action);
    }

    if (action.sender && action.sender.type === SenderType.Main) {
        // Do not send in loop an action already sent by main process
        return next(action);
    }

    // Get action serializer
    const actionSerializer = container.get("action-serializer") as ActionSerializer;

    // Send this action to the main process
    ipcRenderer.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.RendererAction,
        payload: {
            action: actionSerializer.serialize(action),
        },
        sender: {
            type: SenderType.Renderer,
            winId: store.getState().win.winId,
        },
    });

    return next(action);
}) as Dispatch<IActionWithSender>;
