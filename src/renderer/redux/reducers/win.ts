import { Action } from "readium-desktop/common/models/redux";

import { winActions } from "readium-desktop/renderer/redux/actions";
import { WinState, WinStatus } from "readium-desktop/renderer/redux/states/win";

const initialState: WinState = {
    status: WinStatus.Unknown,
    winId: null,
};

export function winReducer(
    state: WinState = initialState,
    action: Action,
) {
    switch (action.type) {
        case winActions.ActionType.InitRequest:
            return Object.assign({}, state, {
                winId: action.payload.winId,
            });
        case winActions.ActionType.InitSuccess:
            return Object.assign({}, state, {
                status: WinStatus.Initialized,
            });
        case winActions.ActionType.InitError:
            return Object.assign({}, state, {
                status: WinStatus.Error,
            });
        default:
            return state;
    }
}
