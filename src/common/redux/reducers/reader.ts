import * as uuid from "uuid";

import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { readerActions } from "readium-desktop/common/redux/actions";
import { ReaderState } from "readium-desktop/common/redux/states/reader";

const initialState: ReaderState = {
    readers: {},
    config: {
        align: "left",
        colCount: "auto",
        dark: false,
        font: "DEFAULT",
        fontSize: "100%",
        invert: false,
        lineHeight: "1.5",
        night: false,
        paged: false,
        readiumcss: true,
        sepia: false,
    },
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
        case readerActions.ActionType.ConfigSetSuccess:
            newState.config = action.payload.config;
            return newState;
        default:
            return state;
    }
}
