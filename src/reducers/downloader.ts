import { DownloadAction } from "readium-desktop/actions/downloader";
import {
    DOWNLOAD_ADD,
    DOWNLOAD_CANCEL,
    DOWNLOAD_FAIL,
    DOWNLOAD_FINISH,
    DOWNLOAD_PROGRESS,
    DOWNLOAD_REMOVE,
    DOWNLOAD_START,
} from "readium-desktop/downloader/constants";
import { Download } from "readium-desktop/common/models/download";
import { DownloadStatus } from "readium-desktop/common/models/downloadable";

export interface DownloaderState {
    downloads: { [identifier: string]: Download };
}

const initialState: DownloaderState = {
    downloads: {},
};

export function downloader(
    state: DownloaderState = initialState,
    action: DownloadAction,
    ): DownloaderState {
    if (action.download === undefined) {
        return state;
    }
    const identifier = action.download.identifier;

    switch (action.type) {
        case DOWNLOAD_ADD:
            state.downloads[identifier] = action.download;
            return state;
        case DOWNLOAD_REMOVE:
            delete state.downloads[identifier];
            return state;
        case DOWNLOAD_CANCEL:
            action.download.status = DownloadStatus.Canceled;
            state.downloads[identifier] = action.download;
            return state;
        case DOWNLOAD_START:
            action.download.status = DownloadStatus.Downloading;
            state.downloads[identifier] = action.download;
            return state;
        case DOWNLOAD_PROGRESS:
            state.downloads[identifier] = action.download;
            return state;
        case DOWNLOAD_FINISH:
            action.download.status = DownloadStatus.Downloaded;
            action.download.progress = 100;
            state.downloads[identifier] = action.download;
            return state;
        case DOWNLOAD_FAIL:
            action.download.status = DownloadStatus.Failed;
            action.download.progress = 0;
            state.downloads[identifier] = action.download;
            return state;
        default:
            return state;
    }
}
