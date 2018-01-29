import { ipcRenderer } from "electron";
import { Store } from "redux";

import { syncIpc } from "readium-desktop/common/ipc";
import {
    opdsActions,
    publicationDownloadActions,
} from "readium-desktop/common/redux/actions";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: any = [
    opdsActions.ActionType.AddRequest,
    opdsActions.ActionType.UpdateRequest,
    opdsActions.ActionType.RemoveRequest,

    publicationDownloadActions.ActionType.AddRequest,
    publicationDownloadActions.ActionType.CancelRequest,
];

export const reduxSyncMiddleware = (_0: Store<any>) => (next: any) => (action: any) => {
    // Does this action must be sent to the main process
    if (SYNCHRONIZABLE_ACTIONS.indexOf(action.type) === -1) {
        // Do not send
        return next(action);
    }

    // Send this action to the main process
    ipcRenderer.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.RendererAction,
        payload: {
            action,
        },
    });

    return next(action);
};
