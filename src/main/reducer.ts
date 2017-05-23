import { combineReducers } from "redux";

import {
    downloader,
    DownloaderState,
} from "readium-desktop/reducers/downloader";

export interface AppState {
    downloader: DownloaderState;
}

export const appReducer = combineReducers({
    downloader,
});
