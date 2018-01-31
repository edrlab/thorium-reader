import { Action } from "readium-desktop/common/models/redux";

import { Download } from "readium-desktop/common/models/download";
import { Publication } from "readium-desktop/common/models/publication";

import { publicationDownloadActions } from "readium-desktop/common/redux/actions";
import { PublicationDownloadState } from "readium-desktop/common/redux/states/publication-download";

const initialState: PublicationDownloadState = {
    downloadIdentifierToPublication: {},
    publicationIdentifierToDownloads: {},
};

export function publicationDownloadReducer(
    state: PublicationDownloadState = initialState,
    action: Action,
    ): PublicationDownloadState {
    const newState = Object.assign({}, state);
    let publication: Publication = null;

    switch (action.type) {
        case publicationDownloadActions.ActionType.AddRequest:
            return newState;
        case publicationDownloadActions.ActionType.AddSuccess:
            publication = action.payload.publication;
            const downloads: Download[] = action.payload.downloads;

            for (const download of downloads) {
                newState.downloadIdentifierToPublication[download.identifier] =
                    publication;
            }

            newState.publicationIdentifierToDownloads[publication.identifier] =
                downloads;

            return newState;
        case publicationDownloadActions.ActionType.Progress:
            const progress = action.payload.progress;
            return newState;
        default:
            return state;
    }
}
