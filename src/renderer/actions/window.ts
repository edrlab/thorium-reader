import { Action } from "redux";

// Window action types
export const WINDOW_INIT = "WINDOW_INIT";

export interface WindowAction extends Action {
}

export function init(): WindowAction {
    return {
        type: WINDOW_INIT,
    };
}

