import { CATALOG_CLEAN, CATALOG_SET } from "readium-desktop/actions/catalog";
import { CatalogAction } from "readium-desktop/actions/catalog";
import { Catalog } from "readium-desktop/models/catalog";

export interface CatalogState {
    catalog: Catalog;
}

const initialState: CatalogState = {
    catalog: null,
};

export function catalogReducer(
    state: CatalogState = initialState,
    action: CatalogAction,
    ): CatalogState {
    switch (action.type) {
        case CATALOG_CLEAN:
            state.catalog = null;
            return state;
        case CATALOG_SET:
            state.catalog = action.catalog;
            return state;
        default:
            return state;
    }
}
