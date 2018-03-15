import { ipcRenderer } from "electron";
import { Store } from "redux";

import { syncIpc } from "readium-desktop/common/ipc";
import {
    catalogActions,
    i18nActions,
    lcpActions,
    opdsActions,
    publicationDownloadActions,
    readerActions,
} from "readium-desktop/common/redux/actions";

import { SenderType } from "readium-desktop/common/models/sync";

import { RootState } from "readium-desktop/renderer/redux/states";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: any = [
    catalogActions.ActionType.FileImportRequest,
    catalogActions.ActionType.LocalPublicationImportRequest,
    catalogActions.ActionType.PublicationRemoveRequest,
    catalogActions.ActionType.LocalLCPImportRequest,

    opdsActions.ActionType.AddRequest,
    opdsActions.ActionType.UpdateRequest,
    opdsActions.ActionType.RemoveRequest,

    publicationDownloadActions.ActionType.AddRequest,
    publicationDownloadActions.ActionType.CancelRequest,

    readerActions.ActionType.OpenRequest,
    readerActions.ActionType.ConfigSetRequest,

    lcpActions.ActionType.PassphraseSubmitRequest,
    lcpActions.ActionType.RenewRequest,
    lcpActions.ActionType.ReturnRequest,

    i18nActions.ActionType.Set,
];

export const reduxSyncMiddleware = (store: Store<any>) => (next: any) => (action: any) => {
    // Does this action must be sent to the main process
    if (SYNCHRONIZABLE_ACTIONS.indexOf(action.type) === -1) {
        // Do not send
        return next(action);
    }

    if (action.sender && action.sender.type === SenderType.Main) {
        // Do not send in loop an action already sent by main process
        return next(action);
    }

    // Send this action to the main process
    ipcRenderer.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.RendererAction,
        payload: {
            action,
        },
        sender: {
            type: SenderType.Renderer,
            winId: store.getState().win.winId,
        },
    });

    return next(action);
};
