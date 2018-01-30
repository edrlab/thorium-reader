import { combineReducers } from "redux";

import {
    catalogReducer
} from "readium-desktop/reducers/catalog";

import {
    streamerReducer
} from "readium-desktop/main/redux/reducers/streamer";

import {
    readerReducer
} from "readium-desktop/main/redux/reducers/reader";

import {
    downloaderReducer,
} from "readium-desktop/common/redux/reducers/downloader";
import { netReducer } from "readium-desktop/common/redux/reducers/net";
import { opdsReducer } from "readium-desktop/common/redux/reducers/opds";
import {
    publicationDownloadReducer,
} from "readium-desktop/common/redux/reducers/publication-download";

export const rootReducer = combineReducers({
    donwloader: downloaderReducer,
    streamer: streamerReducer,
    catalog: catalogReducer,
    publicationDownloads: publicationDownloadReducer,
    reader: readerReducer,
    net: netReducer,
    opds: opdsReducer,
});
