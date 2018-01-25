import { Store } from "redux";

import { syncIpc } from "readium-desktop/common/ipc";
import { netActions, opdsActions } from "readium-desktop/common/redux/actions";
import { container } from "readium-desktop/main/di";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: any = [
    netActions.ActionType.Offline,
    netActions.ActionType.Online,
    opdsActions.ActionType.AddError,
    opdsActions.ActionType.AddSuccess,
    opdsActions.ActionType.UpdateError,
    opdsActions.ActionType.UpdateSuccess,
    opdsActions.ActionType.RemoveError,
    opdsActions.ActionType.RemoveSuccess,
];

export const reduxSyncMiddleware = (_0: Store<any>) => (next: any) => (action: any) => {
    // Test if the action must be sent to the rendeder processes
    if (SYNCHRONIZABLE_ACTIONS.indexOf(action.type) === -1) {
        // Do not send
        return next(action);
    }

    // Send this action to all the registered renderer processes
    const winRegistry = container.get("win-registry") as WinRegistry;
    const windows = winRegistry.getWindows();

    for (const winId of Object.keys(windows)) {
        // Notifies renderer process
        const win = windows[winId];
        win.webContents.send(syncIpc.CHANNEL, {
            type: syncIpc.EventType.MainAction,
            payload: {
                action,
            },
        });
    }

    return next(action);
};
