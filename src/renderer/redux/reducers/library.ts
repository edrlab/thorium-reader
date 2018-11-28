import { Action } from "readium-desktop/common/models/redux";

import { ActionType } from "readium-desktop/renderer/redux/actions/library";

const initialState: any = {
    publicationInfo: {
        publication: null,
    },
};

// The library reducer.
export function libraryReducer(
    state: any = initialState,
    action: Action,
) {
    switch (action.type) {
        case ActionType.PublicationInfoDisplayRequest:
            return Object.assign(
                {},
                state,
                {
                    publicationInfo: { publication : {
                            identifier: action.payload.publication.identifier,
                    }},
                }
            );
        case ActionType.PublicationInfoCloseRequest:
            return Object.assign(
                {},
                state,
                {
                    publicationInfo: { publication : null },
                }
            );
        default:
            return state;
    }
}
