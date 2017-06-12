import {
    CATALOG_CLEAN,
    CATALOG_SET,
    PUBLICATION_DOWNLOAD_ADD,
} from "readium-desktop/actions/catalog";
import { CatalogAction, PublicationAction } from "readium-desktop/actions/catalog";
import { Publication } from "readium-desktop/models/publication";

export interface CatalogState {
    publications: Publication[];
}

const initialState: CatalogState = {
    publications: undefined,
};

export function catalogReducer(
    state: CatalogState = initialState,
    action: CatalogAction|PublicationAction,
    ): CatalogState {
    switch (action.type) {
        case CATALOG_CLEAN:
            state.publications = undefined;
            return state;
        case CATALOG_SET:
            state.publications = (action as CatalogAction).catalog.publications;
            return state;
        case PUBLICATION_DOWNLOAD_ADD:
            console.log("Add publication download");
            return state;
        default:
            return state;
    }
}
