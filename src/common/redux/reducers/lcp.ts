import * as uuid from "uuid";

import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { UserKeyCheckStatus } from "readium-desktop/common/models/lcp";

import { lcpActions } from "readium-desktop/common/redux/actions";
import { LcpState } from "readium-desktop/common/redux/states/lcp";

const initialState: LcpState = {
};

export function lcpReducer(
    state: LcpState = initialState,
    action: Action | ErrorAction,
): LcpState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case lcpActions.ActionType.UserKeyCheckRequest:
            newState.lastUserKeyCheckDate = Date.now();
            newState.lastUserKeyCheck = {
                hint: action.payload.hint,
                publication: action.payload.publication,
                status: UserKeyCheckStatus.Pending,
            };
            return newState;
        case lcpActions.ActionType.UserKeyCheckError:
            newState.lastUserKeyCheckDate = Date.now();
            newState.lastUserKeyCheck.status = UserKeyCheckStatus.Error;
            return newState;
        case lcpActions.ActionType.UserKeyCheckSuccess:
            newState.lastUserKeyCheckDate = Date.now();
            newState.lastUserKeyCheck.status = UserKeyCheckStatus.Success;
            return newState;
        default:
            return state;
    }
}
