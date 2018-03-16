import { Action } from "readium-desktop/common/models/redux";

import { updateActions } from "readium-desktop/common/redux/actions";
import { UpdateState, UpdateStatus } from "readium-desktop/common/redux/states/update";

const initialState: UpdateState = {
    status: UpdateStatus.Unknown,
    latestVersion: null,
    latestVersionUrl: null,
};

export function updateReducer(
    state: UpdateState = initialState,
    action: Action,
) {
    switch (action.type) {
        case updateActions.ActionType.LatestVersionSet:
            return Object.assign({}, state, {
                status: UpdateStatus.Update,
                latestVersion: action.payload.latestVersion,
                latestVersionUrl: action.payload.latestVersionUrl,
            });
        default:
            return state;
    }
}
