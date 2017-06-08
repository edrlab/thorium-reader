
import { combineReducers } from "redux";

import { catalogReducer, CatalogState } from "readium-desktop/reducers/catalog";
import { i18n, I18NState } from "readium-desktop/reducers/i18n";

import {
    windowReducer,
    WindowState,
} from "readium-desktop/renderer/reducers/window";

export interface RendererState {
    i18n: I18NState;
    catalog: CatalogState;
    window: WindowState;
}

export const rootReducer = combineReducers({
    i18n,
    catalog: catalogReducer,
    window: windowReducer,
});
