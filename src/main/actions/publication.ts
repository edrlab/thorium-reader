import { Publication } from "readium-desktop/models/publication";
import { Action } from "redux";

export const PUBLICATION_DOWNLOAD_ADD = "PUBLICATION_DOWNLOAD_ADD";
export const PUBLICATION_DOWNLOAD_START = "PUBLICATION_DOWNLOAD_START";
export const PUBLICATION_DOWNLOAD_PROGRESS = "PUBLICATION_DOWNLOAD_PROGRESS";
export const PUBLICATION_DOWNLOAD_FINISH = "PUBLICATION_DOWNLOAD_FINISH";

export interface PublicationDownloadAction extends Action {
    publication: Publication;
}

export function add(publication: Publication): PublicationDownloadAction {
    return {
        type: PUBLICATION_DOWNLOAD_ADD,
        publication,
    };
}
