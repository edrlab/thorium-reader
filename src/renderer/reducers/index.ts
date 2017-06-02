
import { combineReducers } from "redux";

import { CatalogState } from "readium-desktop/reducers/catalog";
import { catalogReducer } from "readium-desktop/reducers/catalog";
import { i18n, I18NState } from "readium-desktop/reducers/i18n";

export interface RendererState {
    i18n: I18NState;
    catalog: CatalogState;
}

export const rootReducer = combineReducers({
    i18n,
    catalog: catalogReducer,
});
