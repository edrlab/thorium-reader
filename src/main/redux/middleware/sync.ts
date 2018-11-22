// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Store } from "redux";

import { syncIpc } from "readium-desktop/common/ipc";
import {
    catalogActions,
    i18nActions,
    lcpActions,
    netActions,
    opdsActions,
    publicationDownloadActions,
    readerActions,
    updateActions,
} from "readium-desktop/common/redux/actions";
import { container } from "readium-desktop/main/di";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { ActionSerializer } from "readium-desktop/common/services/serializer";

import { SenderType } from "readium-desktop/common/models/sync";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: any = [
    catalogActions.ActionType.SetSuccess,
    catalogActions.ActionType.FileImportError,
    catalogActions.ActionType.LocalPublicationImportSuccess,
    catalogActions.ActionType.LocalPublicationImportError,
    catalogActions.ActionType.PublicationAddSuccess,
    catalogActions.ActionType.PublicationRemoveSuccess,
    catalogActions.ActionType.PublicationRemoveError,
    catalogActions.ActionType.TagAddSuccess,
    catalogActions.ActionType.TagAddError,
    catalogActions.ActionType.TagEditSuccess,
    catalogActions.ActionType.TagEditError,
    catalogActions.ActionType.TagRemoveSuccess,
    catalogActions.ActionType.TagRemoveError,

    netActions.ActionType.Offline,
    netActions.ActionType.Online,

    opdsActions.ActionType.AddError,
    opdsActions.ActionType.AddSuccess,
    opdsActions.ActionType.UpdateError,
    opdsActions.ActionType.UpdateSuccess,
    opdsActions.ActionType.RemoveError,
    opdsActions.ActionType.RemoveSuccess,

    publicationDownloadActions.ActionType.AddError,
    publicationDownloadActions.ActionType.AddSuccess,
    publicationDownloadActions.ActionType.Progress,
    publicationDownloadActions.ActionType.Success,
    publicationDownloadActions.ActionType.Error,
    publicationDownloadActions.ActionType.CancelError,
    publicationDownloadActions.ActionType.CancelSuccess,

    readerActions.ActionType.OpenError,
    readerActions.ActionType.OpenSuccess,
    readerActions.ActionType.ConfigSetError,
    readerActions.ActionType.ConfigSetSuccess,
    readerActions.ActionType.BookmarkSaveError,
    readerActions.ActionType.BookmarkSaveSuccess,

    lcpActions.ActionType.UserKeyCheckRequest,
    lcpActions.ActionType.UserKeyCheckError,
    lcpActions.ActionType.UserKeyCheckSuccess,
    lcpActions.ActionType.PassphraseSubmitError,
    lcpActions.ActionType.PassphraseSubmitSuccess,
    lcpActions.ActionType.RenewSuccess,
    lcpActions.ActionType.RenewError,
    lcpActions.ActionType.ReturnSuccess,
    lcpActions.ActionType.ReturnError,

    i18nActions.ActionType.Set,

    updateActions.ActionType.LatestVersionSet,
];

export const reduxSyncMiddleware = (store: Store<any>) => (next: any) => (action: any) => {
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

    for (const winId of Object.keys(windows)) {
        // Notifies renderer process
        const win = windows[winId];

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
            console.log("Windows does not exist", winId);
        }
    }

    return next(action);
};
