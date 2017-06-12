import { Action } from "redux";

import {
    DOWNLOAD_ADD,
    DOWNLOAD_CANCEL,
    DOWNLOAD_FAIL,
    DOWNLOAD_FINISH,
    DOWNLOAD_PROGRESS,
    DOWNLOAD_REMOVE,
    DOWNLOAD_START,
} from "readium-desktop/downloader/constants";
import { Download } from "readium-desktop/models/download";

export interface DownloadAction extends Action {
    download: Download;
}

export function add(download: Download): DownloadAction {
    return {
        type: DOWNLOAD_ADD,
        download,
    };
}

export function remove(download: Download): DownloadAction {
    return {
        type: DOWNLOAD_REMOVE,
        download,
    };
}

export function cancel(download: Download): DownloadAction {
    return {
        type: DOWNLOAD_CANCEL,
        download,
    };
}

export function start(download: Download): DownloadAction {
    return {
        type: DOWNLOAD_START,
        download,
    };
}

export function progress(download: Download, progress: number): DownloadAction {
    download.progress = progress;
    return {
        type: DOWNLOAD_PROGRESS,
        download,
    };
}

export function finish(download: Download): DownloadAction {
    return {
        type: DOWNLOAD_FINISH,
        download,
    };
}

export function fail(download: Download, error: string): DownloadAction {
    download.error = error;
    return {
        type: DOWNLOAD_FAIL,
        download,
    };
}
