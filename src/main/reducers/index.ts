import { combineReducers } from "redux";

import {
    catalogReducer,
    CatalogState,
} from "readium-desktop/reducers/catalog";
import {
    downloader,
    DownloaderState,
} from "readium-desktop/reducers/downloader";

import {
    publicationDownloadReducer,
    PublicationDownloadState,
} from "readium-desktop/main/reducers/publication-download";

import {
    streamerReducer,
    StreamerState,
} from "readium-desktop/main/reducers/streamer";

import {
    readerReducer,
    ReaderState,
} from "readium-desktop/main/reducers/reader";

export interface AppState {
    streamer: StreamerState;
    downloader: DownloaderState;
    publicationDownloads: PublicationDownloadState;
    catalog: CatalogState;
    reader: ReaderState;
}

export const rootReducer = combineReducers({
    downloader,
    streamer: streamerReducer,
    catalog: catalogReducer,
    publicationDownloads: publicationDownloadReducer,
    reader: readerReducer,
});
