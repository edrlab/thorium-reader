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

export interface AppState {
    downloader: DownloaderState;
    publicationDownloads: PublicationDownloadState;
    catalog: CatalogState;
}

export const rootReducer = combineReducers({
    downloader,
    catalog: catalogReducer,
    publicationDownloads: publicationDownloadReducer,
});
