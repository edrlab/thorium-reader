import * as moment from "moment";

import { ActionType, ApiAction } from "readium-desktop/common/redux/actions/api";

const initialState: any = {
    data: {},
};

// The api reducer.
export function apiReducer(
    state: any = initialState,
    action: ApiAction,
) {
    switch (action.type) {
        case ActionType.Success:
            const data = state.data;
            data[action.meta.api.requestId] = {
                result: action.payload,
                requestId: action.meta.api.requestId,
                moduleId: action.meta.api.moduleId,
                methodId: action.meta.api.methodId,
                date: moment.now(),
            };
            return Object.assign(
                {},
                state,
                {
                    data,
                    lastSuccessAction: action,
                }
            );
        case ActionType.Clean:
            const newState = Object.assign({}, state);
            delete newState.data[action.payload.requestId];
            return newState;
        default:
            return state;
    }
}
