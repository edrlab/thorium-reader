import {
    PUBLICATION_DOWNLOAD_ADD,
    PUBLICATION_DOWNLOAD_START,
    PublicationDownloadAction,
} from "readium-desktop/actions/publication-download";
import { Download } from "readium-desktop/models/download";
import { Publication } from "readium-desktop/models/publication";

export interface PublicationDownloadState {
    // Download identifier => Publication identifier
    downloadIdentifierToPublication: { [identifier: string]: Publication };

    // Publication identifiers => Download identifiers
    publicationIdentifierToDownloads: { [identifier: string]: Download[] };
}

const initialState: PublicationDownloadState = {
    downloadIdentifierToPublication: {},
    publicationIdentifierToDownloads: {},
};

export function publicationDownloadReducer(
    state: PublicationDownloadState = initialState,
    action: PublicationDownloadAction,
    ): PublicationDownloadState {

    switch (action.type) {
        case PUBLICATION_DOWNLOAD_ADD:
            return state;
        case PUBLICATION_DOWNLOAD_START:
            const publication = action.publication;
            const downloads = action.downloads;

            for (const download of downloads) {
                state.downloadIdentifierToPublication[download.identifier] = publication;
            }

            state.publicationIdentifierToDownloads[publication.identifier] = downloads;
            return state;
        default:
            return state;
    }
}
