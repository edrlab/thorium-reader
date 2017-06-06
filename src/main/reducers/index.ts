import { combineReducers } from "redux";

import {
    catalogReducer,
    CatalogState
} from "readium-desktop/reducers/catalog";
import {
    downloader,
    DownloaderState,
} from "readium-desktop/reducers/downloader";


export interface AppState {
    downloader: DownloaderState;
    catalog: CatalogState;
}

export const rootReducer = combineReducers({
    downloader,
    catalog: catalogReducer,
});
