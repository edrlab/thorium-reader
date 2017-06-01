import { combineReducers } from "redux";

import { i18n, I18NState } from "readium-desktop/reducers/i18n";

export interface RendererState {
    i18n: I18NState;
}

export const renderer = combineReducers({
    i18n,
});
