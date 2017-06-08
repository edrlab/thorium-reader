import { CATALOG_CLEAN, CATALOG_SET } from "readium-desktop/actions/catalog";
import { CatalogAction } from "readium-desktop/actions/catalog";
import { Publication } from "readium-desktop/models/publication";

export interface CatalogState {
    publications: Publication[];
}

const initialState: CatalogState = {
    publications: undefined,
};

export function catalogReducer(
    state: CatalogState = initialState,
    action: CatalogAction,
    ): CatalogState {
    switch (action.type) {
        case CATALOG_CLEAN:
            state.publications = undefined;
            return state;
        case CATALOG_SET:
            state.publications = action.catalog.publications;
            return state;
        default:
            return state;
    }
}
