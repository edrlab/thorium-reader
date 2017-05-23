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
import { Download, DownloadStatus } from "readium-desktop/downloader/download";

export interface DownloaderState {
    downloads: { [id: string]: Download };
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
    let uuid = action.download.uuid;

    switch (action.type) {
        case DOWNLOAD_ADD:
            state.downloads[uuid] = action.download;
            return state;
        case DOWNLOAD_REMOVE:
            delete state.downloads[uuid];
            return state;
        case DOWNLOAD_CANCEL:
            action.download.status = DownloadStatus.Canceled;
            state.downloads[uuid] = action.download;
            return state;
        case DOWNLOAD_START:
            action.download.status = DownloadStatus.Downloading;
            state.downloads[uuid] = action.download;
            return state;
        case DOWNLOAD_PROGRESS:
            state.downloads[uuid] = action.download;
            return state;
        case DOWNLOAD_FINISH:
            action.download.status = DownloadStatus.Downloaded;
            action.download.progress = 100;
            state.downloads[uuid] = action.download;
            return state;
        case DOWNLOAD_FAIL:
            action.download.status = DownloadStatus.Failed;
            action.download.progress = 0;
            state.downloads[uuid] = action.download;
            return state;
        default:
            return state;
    }
}
