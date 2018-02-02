import * as uuid from "uuid";

import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { readerActions } from "readium-desktop/common/redux/actions";
import { ReaderState } from "readium-desktop/common/redux/states/reader";

const initialState: ReaderState = {
    readers: {},
};

export function readerReducer(
    state: ReaderState = initialState,
    action: Action | ErrorAction,
): ReaderState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case readerActions.ActionType.OpenSuccess:
            newState.readers[action.payload.reader.identifier] = action.payload.reader;
            return newState;
        case readerActions.ActionType.CloseSuccess:
            delete newState.readers[action.payload.reader.identifier];
            return newState;
        default:
            return state;
    }
}
