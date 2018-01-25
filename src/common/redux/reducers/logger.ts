import { Action } from "readium-desktop/common/models/redux";

import { loggerActions } from "readium-desktop/common/redux/actions";
import { LoggerState } from "readium-desktop/common/redux/states/logger";

const initialState: LoggerState = {
    lastMessage: null,
};

export function loggerReducer(
    state: LoggerState = initialState,
    action: Action,
) {
    switch (action.type) {
        case loggerActions.ActionType.Info:
            return Object.assign({}, state, {
                lastMessage: action.payload.message,
            });
        default:
            return state;
    }
}
