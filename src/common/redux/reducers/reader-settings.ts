import * as uuid from "uuid";

import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { readerSettingsActions } from "readium-desktop/common/redux/actions";
import { ReaderSettingsState } from "readium-desktop/common/redux/states/reader-settings";

const initialState: ReaderSettingsState = {
    settings: {
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

export function readerSettingsReducer(
    state: ReaderSettingsState = initialState,
    action: Action | ErrorAction,
): ReaderSettingsState {
    const newState = Object.assign({}, state);
    switch (action.type) {
        case readerSettingsActions.ActionType.SaveSuccess:
            newState.settings = action.payload.settings;
            return newState;
        case readerSettingsActions.ActionType.SaveError:
            return state;
        case readerSettingsActions.ActionType.RestoreSuccess:
            newState.settings = action.payload.settings;
            return newState;
        case readerSettingsActions.ActionType.RestoreError:
            return state;

        default:
            return state;
    }
}
