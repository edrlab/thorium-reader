import { ipcRenderer } from "electron";
import { Store } from "redux";

import { syncIpc } from "readium-desktop/common/ipc";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: any = [];

export const reduxSyncMiddleware = (_0: Store<any>) => (next: any) => (action: any) => {
    if (SYNCHRONIZABLE_ACTIONS.indexOf(action.type) === -1) {
        return next(action);
    }

    ipcRenderer.send(syncIpc.CHANNEL, {
        type: syncIpc.EventType.RendererAction,
        payload: {
            action,
        },
    });

    return next(action);
};
