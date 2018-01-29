import {
    CATALOG_CLEAN,
    CATALOG_SET,
} from "readium-desktop/actions/catalog";
import {
    CatalogAction,
    PUBLICATION_UPDATE,
    PublicationAction,
} from "readium-desktop/actions/catalog";
import { Publication } from "readium-desktop/common/models/publication";

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
        case PUBLICATION_UPDATE:
            const publicationToUpdate = (action as PublicationAction).publication;

            for (let index in state.publications) {
                let publication = state.publications[index];

                if (publication.identifier !==  publicationToUpdate.identifier) {
                    continue;
                }

                state.publications[index] = publicationToUpdate;
                break;
            }

            return state;
        default:
            return state;
    }
}
