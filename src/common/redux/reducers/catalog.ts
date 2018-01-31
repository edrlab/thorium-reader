import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { Publication } from "readium-desktop/common/models/publication";
import { catalogActions } from "readium-desktop/common/redux/actions";
import { CatalogState } from "readium-desktop/common/redux/states/catalog";

const initialState: CatalogState = {
    publications: undefined,
};

export function catalogReducer(
    state: CatalogState = initialState,
    action: Action | ErrorAction,
): CatalogState {
    const newState = Object.assign({}, state);

    switch (action.type) {
        case catalogActions.ActionType.SetSuccess:
            newState.publications = action.payload.publications;
            return newState;
        case catalogActions.ActionType.PublicationRemoveSuccess:
            const removedPub = action.payload.publication;
            newState.publications = [];

            for (const pub of state.publications) {
                if (pub.identifier === removedPub.identifier) {
                    continue;
                }

                newState.publications.push(pub);
            }
            return newState;
        case catalogActions.ActionType.PublicationAddSuccess:
        case catalogActions.ActionType.LocalPublicationImportSuccess:
            const addedPub = action.payload.publication;
            newState.publications.push(addedPub);
            return newState;
        default:
            return state;
    }
}
