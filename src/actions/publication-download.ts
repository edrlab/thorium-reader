import { Action } from "redux";

import { Download } from "readium-desktop/models/download";
import { Publication } from "readium-desktop/models/publication";

// Publication download action types
export const PUBLICATION_DOWNLOAD_ADD = "PUBLICATION_DOWNLOAD_ADD";
export const PUBLICATION_DOWNLOAD_START = "PUBLICATION_DOWNLOAD_START";
export const PUBLICATION_DOWNLOAD_PROGRESS = "PUBLICATION_DOWNLOAD_PROGRESS";
export const PUBLICATION_DOWNLOAD_FINISH = "PUBLICATION_DOWNLOAD_FINISH";
export const PUBLICATION_DOWNLOAD_CANCEL = "PUBLICATION_DOWNLOAD_CANCEL";
export const PUBLICATION_FILE_IMPORT = "PUBLICATION_FILE_IMPORT";

export interface PublicationDownloadAction extends Action {
    publication?: Publication;
    downloads?: Download[];
    progress?: number;
    files?: File[];
}

export function add(publication: Publication): PublicationDownloadAction {
    return {
        type: PUBLICATION_DOWNLOAD_ADD,
        publication,
    };
}

export function start(publication: Publication, downloads: Download[]): PublicationDownloadAction {
    return {
        type: PUBLICATION_DOWNLOAD_START,
        publication,
        downloads,
    };
}

export function progress(publication: Publication, progress: number): PublicationDownloadAction {
    return {
        type: PUBLICATION_DOWNLOAD_PROGRESS,
        publication,
        progress,
    };
}

export function finish(publication: Publication): PublicationDownloadAction {
    return {
        type: PUBLICATION_DOWNLOAD_FINISH,
        publication,
    };
}

export function cancel(publication: Publication): PublicationDownloadAction {
    return {
        type: PUBLICATION_DOWNLOAD_CANCEL,
        publication,
    };
}

export function fileImport(files: File[]): PublicationDownloadAction {
    return {
        type: PUBLICATION_FILE_IMPORT,
        files,
    };
}
