import { Action } from "redux";

// Window action types
export const WINDOW_INIT = "WINDOW_INIT";
// export const WINDOW_LIBRARY = "WINDOW_LIBRARY";
// export const WINDOW_READER = "WINDOW_READER";

export interface WindowAction extends Action {
}

export function init(): WindowAction {
    return {
        type: WINDOW_INIT,
    };
}

// export function showReader(): WindowAction {
//     return {
//         type: WINDOW_READER,
//     };
// }

// export function showLibrary(): WindowAction {
//     return {
//         type: WINDOW_LIBRARY,
//     };
// }
