import { Action } from "readium-desktop/common/models/redux";

import { netActions } from "readium-desktop/common/redux/actions";
import { NetState, NetStatus } from "readium-desktop/common/redux/states/net";

const initialState: NetState = {
    status: NetStatus.Unknown,
};

export function netReducer(
    state: NetState = initialState,
    action: Action,
) {
    switch (action.type) {
        case netActions.ActionType.Offline:
            return Object.assign({}, state, {
                status: NetStatus.Offline,
            });
        case netActions.ActionType.Online:
            return Object.assign({}, state, {
                status: NetStatus.Online,
            });
        default:
            return state;
    }
}
