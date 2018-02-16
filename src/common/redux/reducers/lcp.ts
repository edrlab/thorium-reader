import * as uuid from "uuid";

import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { lcpActions } from "readium-desktop/common/redux/actions";
import { LcpState } from "readium-desktop/common/redux/states/lcp";

const initialState: LcpState = {
};

export function readerReducer(
    state: LcpState = initialState,
    action: Action | ErrorAction,
): LcpState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case lcpActions.ActionType.PassphraseSuccess:
            return newState;
        default:
            return state;
    }
}
