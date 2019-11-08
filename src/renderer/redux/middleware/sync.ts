// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ipcRenderer } from "electron";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender, SenderType } from "readium-desktop/common/models/sync";
import { apiActions, i18nActions, readerActions } from "readium-desktop/common/redux/actions";
import { diRendererGet } from "readium-desktop/renderer/di";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: string[] = [

    apiActions.request.ID,

    readerActions.openRequest.ID,
    readerActions.closeRequest.ID,
    readerActions.detachModeRequest.ID,
    readerActions.configSetRequest.ID,
    readerActions.saveBookmarkRequest.ID,
    readerActions.fullScreenRequest.ID,

    i18nActions.setLocale.ID,
];

export const reduxSyncMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>>) =>
    (next: Dispatch<ActionWithSender>) =>
    ((action: ActionWithSender) => {

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
    const actionSerializer = diRendererGet("action-serializer");

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
    } as syncIpc.EventPayload);

    return next(action);
}) as Dispatch<ActionWithSender>;
