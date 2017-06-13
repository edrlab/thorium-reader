import { Download } from "readium-desktop/models/download";
import { Publication } from "readium-desktop/models/publication";
import { PublicationDownloadAction,
    PUBLICATION_DOWNLOAD_ADD,
    PUBLICATION_DOWNLOAD_FINISH,
    PUBLICATION_DOWNLOAD_PROGRESS,
    PUBLICATION_DOWNLOAD_START,
} from "readium-desktop/actions/publication-download";

export interface PublicationDownloadState {
    // Download identifier => Publication identifier
    downloadToPublication: { [identifier: string]: string };

    // Publication identifiers => Download identifiers
    publicationToDownloads: { [identifier: string]: string[] };
}

const initialState: PublicationDownloadState = {
    downloadToPublication: {},
    publicationToDownloads: {},
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
            let downloadIdentifiers: string[] = [];

            for (const download of downloads) {
                state.downloadToPublication[download.identifier] = publication.identifier;
            }

            state.publicationToDownloads[publication.identifier] = downloadIdentifiers;
            return state;
        default:
            return state;
    }
}
