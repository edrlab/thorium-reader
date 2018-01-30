import { Identifiable } from "./../../models/identifiable";
import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { Download } from "readium-desktop/common/models/download";
import { DownloadStatus } from "readium-desktop/common/models/downloadable";

import { downloaderActions } from "readium-desktop/common/redux/actions";
import { DownloaderState } from "readium-desktop/common/redux/states/downloader";

const initialState: DownloaderState = {
    downloads: {},
};

export function downloaderReducer(
    state: DownloaderState = initialState,
    action: Action | ErrorAction,
): DownloaderState {
    const newState = Object.assign({}, state);
    let download = null;
    let identifier = null;

    switch (action.type) {
        case downloaderActions.ActionType.AddRequest:
            download = action.payload.download;
            identifier = download.identifier;
            newState.downloads[identifier] = Object.assign({}, download);
            return newState;
        case downloaderActions.ActionType.AddSuccess:
            download = action.payload.download;
            identifier = download.identifier;
            newState.downloads[identifier].status = DownloadStatus.Downloading;
            newState.downloads[identifier].progress = 0;
            return newState;
        case downloaderActions.ActionType.CancelSuccess:
            download = action.payload.download;
            identifier = download.identifier;
            newState.downloads[identifier].status = DownloadStatus.Canceled;
            return newState;
        case downloaderActions.ActionType.Error:
            download = (action as ErrorAction).meta.download;
            identifier = download.identifier;
            newState.downloads[identifier].status = DownloadStatus.Failed;
            return newState;
        case downloaderActions.ActionType.PostProcess:
            download = action.payload.download;
            identifier = download.identifier;
            newState.downloads[identifier].status = DownloadStatus.Downloaded;
            newState.downloads[identifier].progress = 100;
            return state;
        case downloaderActions.ActionType.Progress:
            download = action.payload.download;
            identifier = download.identifier;
            newState.downloads[identifier].progress = action.payload.progress;
            return newState;
        default:
            return state;
    }
}
