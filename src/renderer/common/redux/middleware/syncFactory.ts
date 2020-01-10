// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ipcRenderer } from "electron";
import { syncIpc } from "readium-desktop/common/ipc";
import { ActionWithSender, SenderType } from "readium-desktop/common/models/sync";
import { diLibraryGet } from "readium-desktop/renderer/library/di";
import { AnyAction, Dispatch, MiddlewareAPI } from "redux";

export function syncFactory(SYNCHRONIZABLE_ACTIONS: string[]) {

    return (store: MiddlewareAPI<Dispatch<AnyAction>>) =>
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
                    const actionSerializer = diLibraryGet("action-serializer");

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
                });

}
