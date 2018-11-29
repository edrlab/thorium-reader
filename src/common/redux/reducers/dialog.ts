import { Action } from "readium-desktop/common/models/redux";

import { ActionType } from "readium-desktop/common/redux/actions/dialog";

const initialState: any = {
    open: false,
    type: null,
    data: null,
};

// The dialog reducer.
export function dialogReducer(
    state: any = initialState,
    action: Action,
) {
    switch (action.type) {
        case ActionType.OpenRequest:
            return Object.assign(
                {},
                state,
                {
                    open: true,
                    type: action.payload.type,
                    data: action.payload.data,
                }
            );
        case ActionType.CloseRequest:
            return Object.assign(
                {},
                initialState,
            );
        default:
            return state;
    }
}
